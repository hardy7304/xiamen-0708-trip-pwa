export interface MapSpot {
  id: string;
  name: string;
  category: 'transport' | 'hotel' | 'attraction' | 'food' | 'shopping' | 'massage' | 'other' | string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  amapUrl?: string;
  note?: string;
  days: string[];
  source: 'built-in' | 'sheet' | 'manual';
  createdAt?: string;
  updatedAt?: string;
}

export function geoGoogle(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
export function geoAmap(query: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}`;
}

export const builtInSpots: MapSpot[] = [
  {
    id: 'builtin-1',
    name: '高雄小港機場',
    category: 'transport',
    days: ['7/8'],
    googleMapsUrl: geoGoogle('高雄小港機場'),
    source: 'built-in',
  },
  {
    id: 'builtin-2',
    name: '金門尚義機場',
    category: 'transport',
    days: ['7/8', '7/15'],
    googleMapsUrl: geoGoogle('金門尚義機場'),
    source: 'built-in',
  },
  {
    id: 'builtin-3',
    name: '台南機場',
    category: 'transport',
    days: ['7/15'],
    googleMapsUrl: geoGoogle('台南機場'),
    source: 'built-in',
  },
  {
    id: 'builtin-4',
    name: '金門水頭碼頭',
    category: 'transport',
    days: ['7/9', '7/14'],
    googleMapsUrl: geoGoogle('金門水頭碼頭'),
    source: 'built-in',
  },
  {
    id: 'builtin-5',
    name: '廈門五通客運碼頭',
    category: 'transport',
    days: ['7/9', '7/14'],
    amapUrl: geoAmap('厦门五通客运码头'),
    googleMapsUrl: geoGoogle('廈門五通碼頭'),
    source: 'built-in',
  },
  {
    id: 'builtin-6',
    name: '金門家之形民宿',
    category: 'hotel',
    days: ['7/8', '7/9'],
    address: '金門縣金城鎮和平新村80號',
    googleMapsUrl: geoGoogle('金門縣金城鎮和平新村80號'),
    source: 'built-in',
  },
  {
    id: 'builtin-7',
    name: '廈門住宿（待訂）',
    category: 'hotel',
    days: ['7/9', '7/10', '7/11', '7/12', '7/13', '7/14'],
    address: '待確認',
    note: '建議五通/五緣灣區域',
    amapUrl: geoAmap('佰翔五通酒店'),
    source: 'built-in',
  },
];

export const ALL_MAP_DAYS = ['7/8', '7/9', '7/10', '7/11', '7/12', '7/13', '7/14', '7/15'];
export const CAT_ZH: Record<string, string> = {
  transport: '🚕 交通', hotel: '🏨 住宿', attraction: '📍 景點',
  food: '🍜 美食', shopping: '🛍️ 購物', massage: '💆 按摩', other: '⭐ 其他',
};
export const CAT_COLORS: Record<string, string> = {
  transport: '#6b7280', hotel: '#22c55e', attraction: '#2c6e91',
  food: '#e8833a', shopping: '#8b5cf6', massage: '#ec4899', other: '#c9a96e',
};