import type { PlanParameters } from '../../../mavplusz/types/geo';
import type { PlanResult, PlanVertex } from '../../../mavplusz/types/plan';
import { cleanTransitPlaceName, cleanTransitLabel } from '../../labels';
import { getRouteColor } from '../../colors';
import type { JourneyPlan, JourneyPlace, JourneyOptions } from '../../types/plan';
import { decodedCoordinates } from './normalize';

function place(vertex: PlanVertex): JourneyPlace {
  return {
    name: cleanTransitPlaceName(vertex.name || ''),
    lat: vertex.lat,
    lon: vertex.lon,
    stopId: vertex.stop?.gtfsId || undefined,
    platform: vertex.stop?.platformCode || undefined,
  };
}

export function normalizePlan(result: PlanResult): JourneyPlan {
  const seen = new Set<string>();
  return {
    journeys: (result.itineraries ?? []).flatMap((itinerary) => {
      if (
        !itinerary.legs?.length ||
        !Number.isFinite(itinerary.startTime) ||
        !Number.isFinite(itinerary.endTime)
      )
        return [];
      const id = itinerary.legs
        .map(
          (leg) =>
            `${leg.trip?.gtfsId || leg.mode}:${leg.startTime}:${leg.endTime}:${leg.from.name}:${leg.to.name}`,
        )
        .join('|');
      if (seen.has(id)) return [];
      seen.add(id);
      return [
        {
          id,
          startTime: itinerary.startTime,
          endTime: itinerary.endTime,
          duration: itinerary.duration,
          transfers: itinerary.numberOfTransfers,
          walkTime: itinerary.walkTime,
          trackClosure: !!itinerary.trackClosure,
          legs: itinerary.legs.map((leg, index) => ({
            id: `${id}:${index}`,
            mode: leg.mode || (leg.transitLeg ? 'BUS' : 'WALK'),
            transit: leg.transitLeg,
            from: place(leg.from),
            to: place(leg.to),
            startTime: leg.startTime,
            endTime: leg.endTime,
            duration: leg.duration,
            distance: leg.distance,
            departureDelay: leg.departureDelay || 0,
            arrivalDelay: leg.arrivalDelay || 0,
            realtime: !!leg.realTime,
            canceled: leg.realtimeState === 'CANCELED',
            staySeated: !!leg.interlineWithPreviousLeg,
            routeName: leg.route?.shortName || undefined,
            routeColor: getRouteColor(leg.mode, leg.route?.color, leg.route?.textColor).primary,
            operator: cleanTransitLabel(leg.agency?.name || '') || undefined,
            headsign: leg.headsign || leg.trip?.tripHeadsign || undefined,
            tripName: cleanTransitLabel(leg.trip?.tripShortName || '') || undefined,
            tripId: leg.trip?.gtfsId || undefined,
            serviceDate: leg.serviceDate || undefined,
            coordinates: decodedCoordinates(leg.legGeometry?.points),
            intermediateStops: (leg.intermediateStops ?? []).map((stop) => ({
              name: cleanTransitPlaceName(stop.name || ''),
              lat: stop.lat,
              lon: stop.lon,
            })),
            services: (leg.infoServices ?? [])
              .filter((service) => service.displayable)
              .map((service) => ({
                ...service,
                name: cleanTransitLabel(service.name),
                fromStop: null,
                tillStop: null,
              })),
            steps: (leg.steps ?? []).map((step) => ({
              direction: step.relativeDirection || 'CONTINUE',
              heading: step.absoluteDirection || '',
              street: cleanTransitLabel(step.streetName || ''),
              distance: step.distance,
            })),
            notices: [
              ...new Set(
                [
                  ...(leg.route?.alerts ?? []),
                  ...(leg.trip?.alerts ?? []),
                  ...(leg.agency?.alerts ?? []),
                ]
                  .map((alert) =>
                    cleanTransitLabel(alert.alertHeaderText || alert.alertDescriptionText || ''),
                  )
                  .filter(Boolean),
              ),
            ],
          })),
        },
      ];
    }),
    warnings: [
      ...new Set(
        [...(result.routingWarnings ?? []), ...(result.routingWarningsWithCode ?? [])]
          .map((warning) => cleanTransitLabel(warning.description || ''))
          .filter(Boolean),
      ),
    ],
    errors: (result.routingErrors ?? [])
      .map((error) => cleanTransitLabel(error.description || ''))
      .filter(Boolean),
    nextPageCursor: result.nextPageCursor || undefined,
    previousPageCursor: result.previousPageCursor || undefined,
  };
}

export function normalizePlanOptions(
  result: PlanParameters,
  language: 'hu' | 'en',
): JourneyOptions {
  const label = (texts: { lang: string; text: string }[], fallback = '') =>
    cleanTransitLabel(texts.find((text) => text.lang.split('-')[0] === language)?.text || fallback);
  return {
    comfortGroups: result.comfortLevelCategories
      .filter((group) => group.comfortLevels.length)
      .map((group) => ({
        label: label(group.nameI18n, group.name),
        options: [...group.comfortLevels]
          .sort((a, b) => (a.listOrder || 0) - (b.listOrder || 0))
          .map((option) => ({
            id: option.fareUicCode,
            label: label(option.nameI18n, option.name),
            disables: [],
          })),
      })),
    filterGroups: [...result.searchParameterGroups]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap((group) =>
        group.filterType === 'searchParameters' || group.filterType === 'transitPassFilter'
          ? [
              {
                label: label(group.groupName),
                field: group.filterType,
                options: group.searchParameters.map((option) => ({
                  id: option.code,
                  label: label(option.nameI18n, option.code),
                  disables: option.disablerComfortLevels.map((level) => level.fareUicCode),
                })),
              },
            ]
          : [],
      ),
  };
}
