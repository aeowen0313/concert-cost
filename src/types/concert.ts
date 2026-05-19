export type Concert = {
  id: string;
  user_id: string;
  concert_name: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  concert_date: string;
  distance_from_home: number;
  hours_at_event: number;
  ticket_cost: number;
  ticket_fees: number;
  parking_cost: number;
  food_drink_cost: number;
  merchandise_cost: number;
  lodging_cost: number;
  travel_cost: number;
  other_cost: number;
  fun_rating: number;
  notes: string | null;
  created_at: string;
};

export type ConcertInsert = Omit<
  Concert,
  "id" | "user_id" | "created_at"
>;
