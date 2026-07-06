import { useState } from 'react';
import type { Stay } from '../data/trip';
import MapActions from './MapActions';

interface StayCardProps {
  stay: Stay;
  hotelName: string;
  onHotelNameChange: (name: string) => void;
}

export default function StayCard({ stay, hotelName, onHotelNameChange }: StayCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hotelName || '');

  const displayName = hotelName || stay.name;
  const displayStatus = hotelName ? 'confirmed-by-user' : stay.status;
  const isPending = displayStatus === 'pending';
  const isUserConfirmed = displayStatus === 'confirmed-by-user';

  const handleSave = () => {
    onHotelNameChange(draft.trim());
    setEditing(false);
  };

  return (
    <div className={`bg-soft-white rounded-card shadow-card p-5 border ${
      isPending ? 'border-amber-200' : isUserConfirmed ? 'border-green-200' : 'border-sand/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏨</span>
          <div>
            <p className="text-sm font-semibold text-navy">{displayName}</p>
            <p className="text-xs text-warm-gray">{stay.location === 'kinmen' ? '金門' : '廈門'}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          isPending ? 'bg-amber-100 text-amber-700' : isUserConfirmed ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'
        }`}>
          {isPending ? '待訂' : isUserConfirmed ? '已訂' : stay.status}
        </span>
      </div>
      <p className="text-xs text-warm-gray mb-3">{stay.address}</p>
      <div className="flex items-center gap-4 text-xs text-warm-gray mb-3">
        <div><span className="text-gold">入住 </span>{stay.checkIn}</div>
        <div><span className="text-gold">退房 </span>{stay.checkOut}</div>
      </div>
      <p className="text-xs text-warm-gray mb-1">{stay.roomType}</p>

      {/* Map actions */}
      <div className="mt-2 mb-3">
        <MapActions name={displayName} address={stay.address} />
      </div>

      {/* Pending suggestions */}
      {isPending && stay.suggestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 mb-3">
          <p className="text-xs text-amber-800 font-medium mb-1">💡 建議住宿</p>
          <p className="text-xs text-amber-700">{stay.suggestion}</p>
        </div>
      )}

      {/* Hotel name input */}
      <div className="border-t border-sand/50 pt-3 mt-2">
        {editing ? (
          <div className="flex gap-2 items-center">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="輸入已訂飯店名稱"
              className="flex-1 text-xs bg-cream rounded-lg px-3 py-2 border border-sand"
              autoFocus
            />
            <button onClick={handleSave} className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg font-medium">儲存</button>
            <button onClick={() => { setEditing(false); setDraft(hotelName || ''); }} className="text-xs px-2 py-1.5 text-warm-gray">取消</button>
          </div>
        ) : (
          <button onClick={() => { setEditing(true); setDraft(hotelName || ''); }}
            className="text-xs text-ocean font-medium hover:underline">
            {hotelName ? '✏️ 修改飯店名稱' : '✏️ 填入已訂飯店名稱'}
          </button>
        )}
      </div>

      {stay.notes.length > 0 && (
        <div className="border-t border-sand/50 pt-3 mt-2">
          {stay.notes.map((note, i) => (
            <p key={i} className="text-xs text-coral/80 flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="shrink-0">⚠️</span>
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}