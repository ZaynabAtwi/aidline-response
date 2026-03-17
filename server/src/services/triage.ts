import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

interface TriageResult {
  category: 'medical_emergency' | 'medication_need' | 'humanitarian_aid' | 'general_inquiry';
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  required_responder_type: 'healthcare' | 'pharmacy' | 'ngo' | 'general';
  confidence: number;
  notes: string;
}

const MEDICAL_KEYWORDS = [
  'doctor', 'hospital', 'clinic', 'injury', 'pain', 'bleeding', 'emergency',
  'ambulance', 'surgery', 'fever', 'infection', 'broken', 'heart', 'breathing',
  'unconscious', 'burn', 'wound', 'medical', 'health', 'sick', 'ill',
  'طبيب', 'مستشفى', 'عيادة', 'إصابة', 'ألم', 'نزيف', 'طوارئ', 'إسعاف',
];

const MEDICATION_KEYWORDS = [
  'medicine', 'medication', 'drug', 'pharmacy', 'prescription', 'insulin',
  'pill', 'tablet', 'inhaler', 'antibiotic', 'painkiller', 'dose',
  'دواء', 'صيدلية', 'وصفة', 'أنسولين', 'مسكن', 'مضاد',
];

const HUMANITARIAN_KEYWORDS = [
  'shelter', 'food', 'water', 'clothing', 'blanket', 'tent', 'aid',
  'refugee', 'displaced', 'support', 'assistance', 'humanitarian', 'ngo',
  'مأوى', 'طعام', 'ماء', 'ملابس', 'بطانية', 'خيمة', 'مساعدة', 'لاجئ', 'نازح',
];

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => count + (lower.includes(kw.toLowerCase()) ? 1 : 0), 0);
}

export function classifyRequest(
  requestType: string,
  description: string,
  urgencyLevel: string
): TriageResult {
  const text = `${requestType} ${description}`.toLowerCase();

  const medicalScore = countKeywordMatches(text, MEDICAL_KEYWORDS);
  const medicationScore = countKeywordMatches(text, MEDICATION_KEYWORDS);
  const humanitarianScore = countKeywordMatches(text, HUMANITARIAN_KEYWORDS);

  if (requestType === 'sos') {
    return {
      category: 'medical_emergency',
      priority_level: 'critical',
      required_responder_type: 'healthcare',
      confidence: 95,
      notes: 'SOS request automatically classified as critical medical emergency',
    };
  }

  let category: TriageResult['category'] = 'general_inquiry';
  let responderType: TriageResult['required_responder_type'] = 'general';
  let confidence = 60;

  const maxScore = Math.max(medicalScore, medicationScore, humanitarianScore);

  if (requestType === 'medical' || medicalScore >= maxScore && medicalScore > 0) {
    category = 'medical_emergency';
    responderType = 'healthcare';
    confidence = Math.min(95, 60 + medicalScore * 10);
  } else if (requestType === 'medication' || medicationScore >= maxScore && medicationScore > 0) {
    category = 'medication_need';
    responderType = 'pharmacy';
    confidence = Math.min(95, 60 + medicationScore * 10);
  } else if (requestType === 'humanitarian' || humanitarianScore >= maxScore && humanitarianScore > 0) {
    category = 'humanitarian_aid';
    responderType = 'ngo';
    confidence = Math.min(95, 60 + humanitarianScore * 10);
  }

  let priorityLevel: TriageResult['priority_level'] = urgencyLevel as TriageResult['priority_level'];
  if (!['low', 'medium', 'high', 'critical'].includes(priorityLevel)) {
    priorityLevel = 'medium';
  }

  if (category === 'medical_emergency' && priorityLevel === 'low') {
    priorityLevel = 'medium';
  }

  return {
    category,
    priority_level: priorityLevel,
    required_responder_type: responderType,
    confidence,
    notes: `Auto-classified based on request type "${requestType}" and content analysis. Medical: ${medicalScore}, Medication: ${medicationScore}, Humanitarian: ${humanitarianScore}.`,
  };
}

export async function performTriage(requestId: string, requestType: string, description: string, urgencyLevel: string) {
  const result = classifyRequest(requestType, description || '', urgencyLevel);
  const id = uuidv4();

  await pool.execute(
    `INSERT INTO request_triage (id, request_id, category, priority_level, required_responder_type, classification_confidence, classification_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, requestId, result.category, result.priority_level, result.required_responder_type, result.confidence, result.notes]
  );

  await pool.execute(
    `UPDATE service_requests SET status = 'classifying', category = ? WHERE id = ?`,
    [result.category, requestId]
  );

  return { id, ...result };
}
