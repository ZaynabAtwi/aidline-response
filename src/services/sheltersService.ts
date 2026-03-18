export interface Shelter {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  capacity: number;
  available_spots: number;
  is_operational: boolean;
  ngo: string | null;
}

const MOCK_SHELTERS: Shelter[] = [
  {
    id: "shelter_1",
    name: "AidLine Shelter A",
    address: "Beirut",
    phone: "+961-01-100001",
    capacity: 120,
    available_spots: 38,
    is_operational: true,
    ngo: "AidLine NGO Hub",
  },
  {
    id: "shelter_2",
    name: "AidLine Shelter B",
    address: "Tripoli",
    phone: "+961-01-100002",
    capacity: 80,
    available_spots: 12,
    is_operational: true,
    ngo: "AidLine NGO Hub",
  },
];

export async function listShelters(): Promise<Shelter[]> {
  return MOCK_SHELTERS;
}
