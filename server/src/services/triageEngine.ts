import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

interface ClassificationResult {
  category: 'medical_emergency' | 'medication_need' | 'humanitarian_aid' | 'general_inquiry';
  priorityScore: number;
  requiredResponderType: 'healthcare_provider' | 'pharmacy' | 'ngo' | 'general_support';
  confidence: number;
  notes: string;
}

const KEYWORD_MAP: Record<string, { category: ClassificationResult['category']; responder: ClassificationResult['requiredResponderType'] }> = {
  'emergency': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'urgent': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'bleeding': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'unconscious': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'heart': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'breathing': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'accident': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'injury': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'pain': { category: 'medical_emergency', responder: 'healthcare_provider' },
  'medication': { category: 'medication_need', responder: 'pharmacy' },
  'medicine': { category: 'medication_need', responder: 'pharmacy' },
  'prescription': { category: 'medication_need', responder: 'pharmacy' },
  'insulin': { category: 'medication_need', responder: 'pharmacy' },
  'pharmacy': { category: 'medication_need', responder: 'pharmacy' },
  'drug': { category: 'medication_need', responder: 'pharmacy' },
  'inhaler': { category: 'medication_need', responder: 'pharmacy' },
  'shelter': { category: 'humanitarian_aid', responder: 'ngo' },
  'food': { category: 'humanitarian_aid', responder: 'ngo' },
  'water': { category: 'humanitarian_aid', responder: 'ngo' },
  'clothing': { category: 'humanitarian_aid', responder: 'ngo' },
  'displacement': { category: 'humanitarian_aid', responder: 'ngo' },
  'refugee': { category: 'humanitarian_aid', responder: 'ngo' },
  'aid': { category: 'humanitarian_aid', responder: 'ngo' },
  'help': { category: 'humanitarian_aid', responder: 'ngo' },
  'assistance': { category: 'humanitarian_aid', responder: 'ngo' },
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const REQUEST_TYPE_MAPPING: Record<string, ClassificationResult['category']> = {
  'sos_emergency': 'medical_emergency',
  'medical_consultation': 'medical_emergency',
  'emergency_medical': 'medical_emergency',
  'medication_need': 'medication_need',
  'humanitarian_aid': 'humanitarian_aid',
  'general_inquiry': 'general_inquiry',
};

function classifyRequest(
  requestType: string,
  title: string,
  description: string | null,
  urgencyLevel: string
): ClassificationResult {
  const text = `${title} ${description || ''}`.toLowerCase();
  const words = text.split(/\s+/);

  let matchedKeywords = 0;
  let totalKeywords = 0;
  const categoryCounts: Record<string, number> = {};
  const responderCounts: Record<string, number> = {};

  for (const word of words) {
    const match = KEYWORD_MAP[word];
    if (match) {
      matchedKeywords++;
      categoryCounts[match.category] = (categoryCounts[match.category] || 0) + 1;
      responderCounts[match.responder] = (responderCounts[match.responder] || 0) + 1;
    }
    totalKeywords++;
  }

  let category = REQUEST_TYPE_MAPPING[requestType] || 'general_inquiry';
  let responder: ClassificationResult['requiredResponderType'] = 'general_support';

  if (matchedKeywords > 0) {
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const topResponder = Object.entries(responderCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) category = topCategory[0] as ClassificationResult['category'];
    if (topResponder) responder = topResponder[0] as ClassificationResult['requiredResponderType'];
  } else {
    if (category === 'medical_emergency') responder = 'healthcare_provider';
    else if (category === 'medication_need') responder = 'pharmacy';
    else if (category === 'humanitarian_aid') responder = 'ngo';
  }

  const basePriority = URGENCY_MULTIPLIERS[urgencyLevel] || 50;
  const keywordBoost = Math.min(matchedKeywords * 5, 25);
  const priorityScore = Math.min(basePriority + keywordBoost, 100);

  const confidence = matchedKeywords > 0
    ? Math.min(0.5 + (matchedKeywords / Math.max(totalKeywords, 1)) * 2, 0.99)
    : 0.6;

  const notes = `Classified as ${category} based on ${matchedKeywords} keyword matches. ` +
    `Request type: ${requestType}, urgency: ${urgencyLevel}. ` +
    `Routing to ${responder}.`;

  return { category, priorityScore, requiredResponderType: responder, confidence, notes };
}

export async function classifyAndStoreRequest(requestId: string): Promise<{
  classificationId: string;
  result: ClassificationResult;
}> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM service_requests WHERE id = ?',
    [requestId]
  );

  if (!rows[0]) throw new Error('Request not found');

  const request = rows[0];
  const result = classifyRequest(
    request.request_type,
    request.title,
    request.description,
    request.urgency_level
  );

  const classificationId = uuidv4();

  await pool.query(
    `INSERT INTO request_classifications
     (id, request_id, classified_category, priority_score, required_responder_type, confidence_score, classification_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      classificationId,
      requestId,
      result.category,
      result.priorityScore,
      result.requiredResponderType,
      result.confidence,
      result.notes,
    ]
  );

  await pool.query(
    'UPDATE service_requests SET status = ? WHERE id = ?',
    ['classified', requestId]
  );

  return { classificationId, result };
}

export { classifyRequest };
