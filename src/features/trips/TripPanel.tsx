import { TripContinuation, useTripContinuation } from './components/TripContinuation';
import { AlertCard } from '~/components/ui/transit/AlertCard';
import { parseTransitHeadsign } from '@/lib/transit/headsign';
import { stopTiming } from '@/lib/transit/stop-times';
import { useStopPreview } from '~/store/useStopPreview';
import { useTranslation } from '@/hooks/useTranslation';
import { serviceDate, validCoordinates } from '@/lib/transit';
import { getDelayFromVehiclePosition } from '@/lib/transit/delay';
import { isBkkRoute } from '@/lib/transit/agency';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { useMapStore } from '@/store/useMapStore';
import { ArrowLeft, Crosshair, Navigation, Route } from 'lucide-react-native';
import { View } from 'react-native';
import { PanelHeader } from '~/components/panels/PanelHeader';
import { Disclosure } from '~/components/ui/Disclosure';
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
  const continuation = useTripContinuation({ id: selection?.tripId ?? '', day: selection?.serviceDay,
    vehicleId: selection?.vehicleId || position?.vehicleId });
  const previousTrips = useMapStore(state => state.previousTrips);
  const { t } = useTranslation();
  const c = useTheme();
  const showPlatforms = items.some(({ stop }) => 'platformCode' in stop && !!stop.platformCode?.trim());
  const headsign = parseTransitHeadsign(trip?.tripHeadsign || route?.longName);
  const alerts = [...new Map((trip?.alerts ?? []).map(alert => [alert.id || alert.alertHash || JSON.stringify(alert), alert])).values()];
  const serviceActions = (
    <>
      {trip && <DelayBadge seconds={getDelayFromVehiclePosition(position)} />}
      <BoardingAction
          route={route}
          licensePlate={position?.licensePlate}
          tripId={selection?.tripId}
          vehicleId={selection?.vehicleId ?? position?.vehicleId}
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
          variant="surface"
          label={t('view_route')}
          onPress={() => {
            useMapStore.getState().setSelectedRouteId(routeId);
            if (trip?.pattern?.id) useMapStore.getState().setSelectedPatternId(trip.pattern.id);
          }}
        />
      )}
      {position && validCoordinates(position.lon, position.lat) && (
        <Button
          variant="surface"
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
          onPress={() => useMapStore.getState().cycleVehicleCamera([position.lon!, position.lat!])}
        />
      )}
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      <PanelHeader
        bkk={isBkkRoute(route)}
        boarding={frontDoor ? 'front-door' : 'none'}
        title={headsign.destination || headsign.notices.join(' · ') || t('trip_details')}
        subtitle={[headsign.destination ? headsign.notices.join(' · ') : '', cleanTransitLabel(trip?.tripShortName)].filter(Boolean).join(' · ')}
        routeLabel={route?.shortName}
        mode={route?.mode}
        color={color}
        headerActions={
          previousTrips.length ? <Button size="icon" icon={ArrowLeft} label={t('back_to_previous_trip')}
            onPress={useMapStore.getState().goBackToTrip} /> : previous ? (
            <Button
              size="icon"
              icon={ArrowLeft}
              label={t('back_to_stop')}
              onPress={useMapStore.getState().goBackToStop}
            />
          ) : undefined
        }
      />
      <TimelineLayers.Provider value={progress.between?.afterStopIndex ?? progress.atStopIndex}>
        <QueryList
          loadingVariant="timeline"
          query={query}
          CellRendererComponent={TripTimelineCell}
          removeClippedSubviews={false}
          testID="trip-timeline"
          data={items}
          keyExtractor={(item) => item.key}
          initialNumToRender={18}
          header={
            <>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderColor: c.border,
                }}
              >
                {serviceActions}
              </View>
              {!!alerts.length && <Disclosure variant="section" title={t('alerts_count', { count: alerts.length })}>
                {alerts.map((alert, index) => <AlertCard key={alert.id || alert.alertHash || index} alert={alert} />)}
              </Disclosure>}
              {frontDoor && <FrontDoorNotice />}
              {position && (
                <Disclosure variant="section" title={t('vehicle_info')}>
                  <VehicleDetails position={position} />
                </Disclosure>
              )}
              {(trip?.infoServices?.some((service) => service.displayable) || trip?.serviceDescriptions?.some((description) => cleanTransitLabel(description).trim())) && (
                <View style={{ paddingVertical: 10, gap: 8 }}>
                  <TripAmenities services={trip?.infoServices} />
                  {trip?.serviceDescriptions?.map((description, i) => {
                    const label = cleanTransitLabel(description).trim();
                    return label ? (
                      <Text key={i} style={{ color: c.secondary, paddingHorizontal: 10, fontSize: 14, lineHeight: 20 }}>
                        {t('operating_days')}: {label}
                      </Text>
                    ) : null;
                  })}
                </View>
              )}
              {trip && (
                <>
                  <Section title={t('stops')} style={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, includeFontPadding: false }} />
                  {!!trip.stoptimes?.length && <TripTimelineHeader mode={route?.mode} showPlatform={showPlatforms} />}
                </>
              )}
            </>
          }
          emptyMessage={t(trip ? 'no_stop_info' : 'no_trip_info')}
          renderItem={({ item, index }) => (
            <TripTimelineRow
              showPlatform={showPlatforms}
              item={item}
              index={index}
              items={items}
              progress={progress}
              mode={route?.mode}
              color={color}
              onSelect={() => {
                const id = 'gtfsId' in item.stop ? item.stop.gtfsId || item.stop.id : item.stop.id;
                if (id) {
                  const arrival = item.time && (stopTiming(item.time, 'arrivals').epoch ?? stopTiming(item.time, 'departures').epoch);
                  useStopPreview.setState({ board: { id, tab: 'departures', fromVehicle: true, ...(selection ? { vehicle: selection } : {}), ...(arrival != null ? { at: arrival } : {}) } });
                  useMapStore.getState().setSelectedStopId(id);
                  if (validCoordinates(item.stop.lon, item.stop.lat))
                    useMapStore.getState().flyTo([item.stop.lon!, item.stop.lat!], 15);
                }
              }}
            />
          )}
          ListFooterComponent={<>
            <TripContinuation continuation={continuation} />
            {trip?.route?.agency?.name ? (
              <Text style={{ padding: 10, color: c.secondary, fontSize: 14, lineHeight: 20 }}>
                {trip.route.agency.name}
              </Text>
            ) : (
              <View style={{ height: 16 }} />
            )}
          </>}
        />
      </TimelineLayers.Provider>
    </View>
  );
}
