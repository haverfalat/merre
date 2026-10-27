import { useTranslation } from '@/hooks/useTranslation';
import { serviceDate, validCoordinates } from '@/lib/transit';
import { getDelayFromVehiclePosition } from '@/lib/transit/delay';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { useMapStore } from '@/store/useMapStore';
import { ArrowLeft, Crosshair, Navigation, Route } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { PanelHeader } from '~/components/panels/PanelHeader';
import { Button } from '~/components/ui/Button';
import { QueryList } from '~/components/ui/QueryList';
import { Section } from '~/components/ui/Section';
import { Text } from '~/components/ui/Text';
import { DelayBadge } from '~/components/ui/transit/DelayBadge';
import { FrontDoorNotice } from '~/components/ui/transit/FrontDoorNotice';
import { TripAmenities } from '~/features/trips/components/TripAmenities';
import { TimelineLayers, TripTimelineCell } from '~/features/trips/components/TripTimelineCell';
import { TripTimelineHeader } from '~/features/trips/components/TripTimelineHeader';
import { TripTimelineRow } from '~/features/trips/components/TripTimelineRow';
import { VehicleDetails } from '~/features/trips/components/VehicleDetails';
import { useTripPanel } from '~/features/trips/hooks/useTripPanel';
import { BoardingAction } from '~/features/tickets/components/BoardingAction';
import { useTheme } from '~/lib/theme';

export function TripPanel() {
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const {
    previous,
    camera,
    query,
    trip,
    position,
    route,
    routeId,
    color,
    progress,
    items,
    frontDoor,
    selection,
  } = useTripPanel();
  const { t } = useTranslation();
  const c = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <PanelHeader
        boarding={frontDoor ? 'front-door' : 'none'}
        title={trip?.tripHeadsign || route?.longName || t('trip_details')}
        subtitle={cleanTransitLabel(trip?.tripShortName)}
        routeLabel={route?.shortName}
        mode={route?.mode}
        color={color}
        headerActions={
          previous ? (
            <Button
              size="icon"
              icon={ArrowLeft}
              label={t('back_to_stop')}
              onPress={useMapStore.getState().goBackToStop}
            />
          ) : undefined
        }
        actions={
          <>
            {trip && (
              <View style={{ justifyContent: 'center' }}>
                <DelayBadge seconds={getDelayFromVehiclePosition(position)} />
              </View>
            )}
            <BoardingAction
              route={route}
              licensePlate={position?.licensePlate}
              tripName={trip?.tripShortName}
              serviceDay={
                selection?.serviceDay ??
                (trip?.stoptimes?.[0]?.serviceDay != null
                  ? serviceDate(trip.stoptimes[0].serviceDay * 1000)
                  : undefined)
              }
            />
            {routeId && (
              <Button
                icon={Route}
                size="icon"
                label={t('view_route')}
                selected
                onPress={() => {
                  useMapStore.getState().setSelectedRouteId(routeId);
                  if (trip?.pattern?.id)
                    useMapStore.getState().setSelectedPatternId(trip.pattern.id);
                }}
              />
            )}
            {!!trip?.alerts?.length && (
              <Button
                label={t('alerts_count', { count: trip.alerts.length })}
                accessibilityState={{ expanded: alertsExpanded }}
                selected={alertsExpanded}
                onPress={() => setAlertsExpanded(!alertsExpanded)}
              />
            )}
            {position && validCoordinates(position.lon, position.lat) && (
              <Button
                size="icon"
                icon={camera === 'heading' ? Navigation : Crosshair}
                selected={camera !== 'free'}
                label={t(
                  camera === 'centered'
                    ? 'follow_vehicle_heading'
                    : camera === 'heading'
                      ? 'stop_following_vehicle'
                      : 're_center',
                )}
                onPress={() =>
                  useMapStore.getState().cycleVehicleCamera([position.lon!, position.lat!])
                }
              />
            )}
          </>
        }
      />
      <TimelineLayers.Provider value={progress.between?.afterStopIndex ?? progress.atStopIndex}>
        <QueryList
          query={query}
          CellRendererComponent={TripTimelineCell}
          removeClippedSubviews={false}
          testID="trip-timeline"
          data={items}
          keyExtractor={(item) => item.key}
          initialNumToRender={18}
          alerts={alertsExpanded ? trip?.alerts : undefined}
          header={
            <>
              {frontDoor && <FrontDoorNotice />}
              {position && <VehicleDetails position={position} />}
              <TripAmenities services={trip?.infoServices} />
              {trip?.serviceDescriptions?.map((description, i) => (
                <Text
                  key={i}
                  style={{
                    color: c.muted,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    fontSize: 11,
                  }}
                >
                  {cleanTransitLabel(description)}
                </Text>
              ))}
              {trip && (
                <>
                  <Section title={t('stops')} />
                  {!!trip.stoptimes?.length && <TripTimelineHeader mode={route?.mode} />}
                </>
              )}
            </>
          }
          emptyMessage={t(trip ? 'no_stop_info' : 'no_trip_info')}
          renderItem={({ item, index }) => (
            <TripTimelineRow
              frontDoor={frontDoor}
              item={item}
              index={index}
              items={items}
              progress={progress}
              mode={route?.mode}
              color={color}
              onSelect={() => {
                const id = 'gtfsId' in item.stop ? item.stop.gtfsId || item.stop.id : item.stop.id;
                if (id) {
                  useMapStore.getState().setSelectedStopId(id);
                  if (validCoordinates(item.stop.lon, item.stop.lat))
                    useMapStore.getState().flyTo([item.stop.lon!, item.stop.lat!], 15);
                }
              }}
            />
          )}
          ListFooterComponent={
            trip?.route?.agency?.name ? (
              <Text style={{ padding: 10, color: c.muted, fontSize: 11 }}>
                {trip.route.agency.name}
              </Text>
            ) : (
              <View style={{ height: 16 }} />
            )
          }
        />
      </TimelineLayers.Provider>
    </View>
  );
}
