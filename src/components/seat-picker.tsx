"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Armchair, Accessibility, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

interface Seat {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  status: string;
  type: string;
  isBooked: boolean;
  isAvailable: boolean;
}

interface RoomWithSeats {
  room: {
    id: string;
    name: string;
    floor: number | null;
    capacity: number;
    testCenter: { id: string; name: string };
  };
  seats: Seat[];
  stats: {
    total: number;
    available: number;
    booked: number;
    disabled: number;
  };
}

interface SeatPickerProps {
  scheduleId: string;
  selectedSeatId: string | null;
  onSeatSelect: (seatId: string | null, seatNumber: string | null) => void;
}

// ─── Component ──────────────────────────────────────────────────────

export function SeatPicker({ scheduleId, selectedSeatId, onSeatSelect }: SeatPickerProps) {
  const { data, isLoading } = useQuery<{ data: RoomWithSeats[] }>({
    queryKey: ["catalog-seats", scheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/catalog/${scheduleId}/seats`);
      if (!res.ok) throw new Error("Failed to fetch seats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rooms = data?.data ?? [];
  if (rooms.length === 0) return null;

  return (
    <div className="space-y-4">
      {rooms.map((roomData) => (
        <RoomSeatGrid
          key={roomData.room.id}
          roomData={roomData}
          selectedSeatId={selectedSeatId}
          onSeatSelect={onSeatSelect}
        />
      ))}
    </div>
  );
}

// ─── Room Seat Grid ─────────────────────────────────────────────────

function RoomSeatGrid({
  roomData,
  selectedSeatId,
  onSeatSelect,
}: {
  roomData: RoomWithSeats;
  selectedSeatId: string | null;
  onSeatSelect: (seatId: string | null, seatNumber: string | null) => void;
}) {
  const { room, seats, stats } = roomData;

  // Build grid from seats
  const maxRow = Math.max(...seats.map((s) => s.row), 0);
  const maxCol = Math.max(...seats.map((s) => s.column), 0);
  const seatMap = new Map<string, Seat>();
  for (const seat of seats) {
    seatMap.set(`${seat.row}-${seat.column}`, seat);
  }

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const handleClick = (seat: Seat) => {
    if (!seat.isAvailable) return;
    if (selectedSeatId === seat.id) {
      onSeatSelect(null, null);
    } else {
      onSeatSelect(seat.id, seat.seatNumber);
    }
  };

  return (
    <div className="space-y-3">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{room.name}</p>
          <p className="text-xs text-muted-foreground">{room.testCenter.name}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          ว่าง <span className="font-semibold text-green-600">{stats.available}</span>/{stats.total}
        </div>
      </div>

      {/* Screen indicator */}
      <div className="mx-auto w-3/4 rounded-t-lg border-2 border-muted bg-muted/30 py-1 text-center text-xs text-muted-foreground">
        หน้าห้อง
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto flex justify-center">
        <div className="inline-flex flex-col gap-1.5 p-2">
          {Array.from({ length: maxRow + 1 }, (_, r) => (
            <div key={r} className="flex items-center gap-1.5">
              {/* Row label */}
              <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                {rowLabels[r] ?? r}
              </span>
              {/* Seats */}
              {Array.from({ length: maxCol + 1 }, (_, c) => {
                const seat = seatMap.get(`${r}-${c}`);
                if (!seat) {
                  return <div key={c} className="h-8 w-8" />;
                }
                return (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeatId === seat.id}
                    onClick={() => handleClick(seat)}
                  />
                );
              })}
            </div>
          ))}
          {/* Column numbers */}
          <div className="flex items-center gap-1.5">
            <span className="w-5" />
            {Array.from({ length: maxCol + 1 }, (_, c) => (
              <span key={c} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
                {c + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-100" />
          ว่าง
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-primary" />
          เลือกอยู่
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-200" />
          จองแล้ว
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-muted" />
          ไม่สามารถเลือกได้
        </span>
      </div>
    </div>
  );
}

// ─── Seat Button ────────────────────────────────────────────────────

function SeatButton({
  seat,
  isSelected,
  onClick,
}: {
  seat: Seat;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isDisabled = seat.status === "DISABLED" || seat.status === "RESERVED";
  const isBooked = seat.isBooked;
  const isAvailable = seat.isAvailable;

  const Icon = seat.type === "WHEELCHAIR"
    ? Accessibility
    : seat.type === "SPECIAL"
      ? Star
      : Armchair;

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={onClick}
      title={`${seat.seatNumber}${isBooked ? " (จองแล้ว)" : isDisabled ? " (ไม่พร้อมใช้งาน)" : ""}`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-xs transition-all",
        isSelected && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1",
        !isSelected && isAvailable && "cursor-pointer border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400",
        isBooked && !isSelected && "cursor-not-allowed bg-red-100 text-red-400",
        isDisabled && "cursor-not-allowed bg-muted text-muted-foreground/40",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
