export interface BoardingActionProps {
  route?: {
    id?: string | null;
    gtfsId?: string | null;
    shortName?: string | null;
    agency?: { id?: string | null; gtfsId?: string | null; name?: string | null } | null;
  } | null;
  licensePlate?: string | null;
  tripId?: string;
  vehicleId?: string | null;
  tripName?: string | null;
  serviceDay?: string;
}
