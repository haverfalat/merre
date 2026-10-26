import type { Mode } from '../types/common';

/**
 * GraphQL query strings, reverse engineered from the mavplusz.hu web client.
 *
 * These are the *full* queries the official OTP UI sends, kept as close to the
 * original as possible so no fields are dropped. Values that were inlined in
 * the captured traffic (`serviceDay`, `language`, bounding boxes, ...) are
 * exposed as variables so the wrapper can parametrize them.
 */

export const PLAN_QUERY = /* GraphQL */ `
  query Plan(
    $arriveBy: Boolean
    $banned: InputBanned
    $bikeReluctance: Float
    $carReluctance: Float
    $date: String
    $fromPlace: String!
    $modes: [TransportMode]
    $numItineraries: Int
    $preferred: InputPreferred
    $time: String
    $toPlace: String!
    $unpreferred: InputUnpreferred
    $walkReluctance: Float
    $walkSpeed: Float
    $wheelchair: Boolean
    $minTransferTime: Int
    $transitPassFilter: [String]
    $comfortLevels: [String]
    $searchParameters: [String]
    $distributionChannel: String!
    $distributionSubChannel: String!
    $passengers: [PassengerInput]
    $pageCursor: String
    $locale: String
  ) {
    plan(
      arriveBy: $arriveBy
      banned: $banned
      bikeReluctance: $bikeReluctance
      carReluctance: $carReluctance
      date: $date
      fromPlace: $fromPlace
      locale: $locale
      numItineraries: $numItineraries
      preferred: $preferred
      time: $time
      toPlace: $toPlace
      transportModes: $modes
      unpreferred: $unpreferred
      walkReluctance: $walkReluctance
      walkSpeed: $walkSpeed
      wheelchair: $wheelchair
      minTransferTime: $minTransferTime
      transitPassFilter: $transitPassFilter
      comfortLevels: $comfortLevels
      searchParameters: $searchParameters
      distributionChannel: $distributionChannel
      distributionSubChannel: $distributionSubChannel
      passengers: $passengers
      pageCursor: $pageCursor
    ) {
      itineraries {
        accessibilityScore
        duration
        numberOfTransfers
        trackClosure
        endTime
        legs {
          agency {
            alerts {
              alertDescriptionText
              alertHeaderText
              alertUrl
              effectiveStartDate
              id
            }
            id
            name
            timezone
            url
          }
          fareProducts {
            id
            product {
              __typename
              id
              name
              ... on DefaultFareProduct {
                medium {
                  id
                  name
                }
                riderCategory {
                  id
                  name
                }
                price {
                  amount
                  currency {
                    code
                    digits
                  }
                }
              }
            }
          }
          accessibilityScore
          arrivalDelay
          departureDelay
          distance
          dropoffType
          duration
          endTime
          boardingPlatformColor
          alightingPlatformColor
          infoServices(language: $locale, onlyDisplayable: true) {
            name
            fontCode
            displayable
            fontCharSet
            fromStopIndex
            tillStopIndex
            fromStop {
              name
              stopId: id
            }
            tillStop {
              name
              stopId: id
            }
          }
          from {
            lat
            lon
            name
            rentalVehicle {
              id
              network
            }
            stop {
              alerts {
                alertDescriptionText
                alertHeaderText
                alertUrl
                effectiveStartDate
                id
              }
              stationUicPricingCode
              code
              gtfsId
              id
              platformCode
              timezone
            }
            vertexType
          }
          to {
            lat
            lon
            name
            rentalVehicle {
              id
              network
            }
            stop {
              alerts {
                alertDescriptionText
                alertHeaderText
                alertUrl
                effectiveStartDate
                id
              }
              stationUicPricingCode
              code
              gtfsId
              id
              platformCode
              timezone
            }
            vertexType
          }
          headsign
          interlineWithPreviousLeg
          intermediateStops {
            lat
            locationType
            lon
            name
            stopCode: code
            stopId: id
          }
          legGeometry {
            length
            points
          }
          mode
          pickupBookingInfo {
            earliestBookingTime {
              daysPrior
            }
          }
          pickupType
          realTime
          realtimeState
          rentedBike
          rideHailingEstimate {
            arrival
            maxPrice {
              amount
              currency {
                code
              }
            }
            minPrice {
              amount
              currency {
                code
              }
            }
            provider {
              id
            }
          }
          route {
            alerts(types: [ROUTE, STOPS_ON_ROUTE]) {
              alertHash
              alertUrl
              alertCause
              alertEffect
              alertHeaderText
              alertSeverityLevel
              alertDescriptionText
              alertUrlTranslations {
                language
                text
              }
              alertHeaderTextTranslations {
                language
                text
              }
              alertDescriptionTextTranslations {
                text
                language
              }
              id
              effectiveStartDate
              effectiveEndDate
              feed
            }
            color
            id
            longName
            shortName
            textColor
            type
          }
          startTime
          steps {
            absoluteDirection
            alerts {
              alertDescriptionText
              alertHeaderText
              alertUrl
              effectiveStartDate
              id
            }
            area
            distance
            elevationProfile {
              distance
              elevation
            }
            lat
            lon
            relativeDirection
            stayOn
            streetName
          }
          transitLeg
          serviceDate
          trip {
            wheelchairAccessible
            bikesAllowed
            tripShortName
            tripHeadsign
            alerts(types: [ROUTE, TRIP, PATTERN]) {
              alertHash
              alertUrl
              alertCause
              alertEffect
              alertHeaderText
              alertSeverityLevel
              alertDescriptionText
              alertUrlTranslations {
                language
                text
              }
              alertHeaderTextTranslations {
                language
                text
              }
              alertDescriptionTextTranslations {
                text
                language
              }
              id
              effectiveStartDate
              effectiveEndDate
              feed
            }
            arrivalStoptime {
              stop {
                gtfsId
                id
                platformCode
              }
              platformColor
              stopPosition
            }
            departureStoptime {
              stop {
                gtfsId
                id
                platformCode
              }
              platformColor
              stopPosition
            }
            isThroughCoach
            gtfsId
            id
          }
        }
        startTime
        waitingTime
        walkTime
      }
      routingWarnings
      routingWarningsWithCode {
        code
        description
        pricingWarningCode
      }
      routingErrors {
        code
        description
        inputField
      }
      nextPageCursor
      previousPageCursor
    }
  }
`;

export const PLAN_PARAMETERS_QUERY = /* GraphQL */ `
  query PlanParameters(
    $language: String!
    $distributionChannel: String!
    $distributionSubChannel: String!
  ) {
    planParameters(
      language: $language
      distributionChannel: $distributionChannel
      distributionSubChannel: $distributionSubChannel
    ) {
      comfortLevelCategories {
        name
        nameI18n {
          lang
          text
        }
        comfortLevels {
          fareUicCode
          name
          nameI18n {
            lang
            text
          }
          listOrder
          mandatoryPlaceReservation
          pricingArea
        }
        reservationSSMainGroups {
          salesMainGroupId
          salesMainGroupName
          salesMainGroupNameI18n {
            lang
            text
          }
          salesServiceGroups {
            salesGroupId
            salesGroupName
            salesGroupNameI18n {
              lang
              text
            }
            salesServices {
              name
              code
            }
          }
        }
      }
      searchParameterGroups {
        filterType
        groupName {
          lang
          text
        }
        iconFile
        order
        searchParameters {
          code
          iconFontCharset
          iconFontCode
          order
          disablerComfortLevels {
            fareUicCode
          }
          nameI18n {
            lang
            text
          }
        }
      }
    }
  }
`;

export const GET_COUNTRIES_QUERY = /* GraphQL */ `
  query getCountries {
    countries {
      isoCode
      name
      nameI18n {
        lang
        text
      }
    }
  }
`;

export const GET_AGENCIES_QUERY = /* GraphQL */ `
  query getAgencies($countryIsoCodes: [String!]!) {
    agencies(countryIsoCodes: $countryIsoCodes) {
      id
      gtfsId
      name
      url
      timezone
      lang
      fareUrl
      uicCode
    }
  }
`;

export const ROUTES_QUERY = /* GraphQL */ `
  query Routes($countryIsoCodes: [String!]!) {
    routes(countryIsoCodes: $countryIsoCodes) {
      id: gtfsId
      agency {
        id: gtfsId
        name
      }
      longName
      shortName
      mode
      type
      color
      textColor
    }
  }
`;

export const STOP_ROUTES_QUERY = /* GraphQL */ `
  query StopRoutes($id: String!) {
    stop(id: $id) {
      id: gtfsId
      parentStation {
        id: gtfsId
      }
      platformCode
      routes {
        shortName
        longName
        mode
        color
        textColor
        id: gtfsId
        patterns {
          id
          directionId
          stops {
            id: gtfsId
            parentStation {
              id: gtfsId
            }
          }
          patternGeometry {
            points
            length
          }
          vehiclePositions {
            speed
            heading
            vehicleModel
            isEstimated
            uicCode
            licensePlate
            trip {
              id
              gtfsId
              routeShortName
              tripShortName
              tripNumber
              tripHeadsign
              route {
                mode
                shortName
                longName
                textColor
                color
              }
              serviceId
              pattern {
                id
              }
            }
            vehicleId
            label
            lat
            lon
            heading
            speed
            lastUpdated
            stopRelationship {
              stop {
                gtfsId
                name
              }
              arrivalTime
              departureTime
              status
            }
            prevOrCurrentStop {
              arrivalDelay
              departureDelay
            }
          }
        }
      }
    }
  }
`;

export const STOPS_BY_RADIUS_QUERY = /* GraphQL */ `
  query StopsByRadius($lat: Float!, $lon: Float!, $radius: Int!) {
    stopsByRadius(lat: $lat, lon: $lon, radius: $radius) {
      edges {
        node {
          stop {
            id: gtfsId
            gtfsId
            code
            name
            lat
            lon
            bearing
            locationType
            platformCode
            routes {
              id: gtfsId
              agency {
                gtfsId
                name
                url
              }
              longName
              mode
              color
              textColor
              shortName
            }
          }
        }
      }
    }
  }
`;

export const STOP_CLUSTERS_QUERY = /* GraphQL */ `
  query StopClusters($ids: [String!]!, $language: String) {
    stopClusters(ids: $ids) {
      id
      gtfsId
      lat
      lon
      name
      groupedChildStops {
        id: gtfsId
        code
        bearing
        lat
        lon
        name(language: $language)
        zoneId
        geometries {
          geoJson
        }
        routes {
          id: gtfsId
          agency {
            gtfsId
            name
            url
          }
          longName
          mode
          color
          textColor
          shortName
        }
      }
    }
  }
`;

export const STOP_QUERY = /* GraphQL */ `
  query Stop($id: String!, $startTime: Long, $timeRange: Int, $language: String) {
    stop(id: $id) {
      id: gtfsId
      code
      lat
      lon
      bearing
      locationType
      name
      wheelchairBoarding
      zoneId
      geometries {
        geoJson
      }
      alerts(types: [STOP, STOP_ON_ROUTES]) {
        alertHash
        alertUrl
        alertCause
        alertEffect
        alertHeaderText
        alertSeverityLevel
        alertDescriptionText
        alertUrlTranslations {
          language
          text
        }
        alertHeaderTextTranslations {
          language
          text
        }
        alertDescriptionTextTranslations {
          text
          language
        }
        id
        effectiveStartDate
        effectiveEndDate
        feed
      }
      routes {
        id: gtfsId
        agency {
          gtfsId
          name
          url
        }
        longName
        mode
        color
        textColor
        shortName
      }
      url
      platformCode
      stopTimes: stoptimesForPatterns(
        startTime: $startTime
        numberOfDepartures: 500
        timeRange: $timeRange
        omitNonPickups: false
      ) {
        pattern {
          directionId
          desc: name
          headsign
          id: code
          fromStopName
          route {
            id: gtfsId
            desc
            color
            textColor
            mode
            shortName
            longName
          }
        }
        times: stoptimes {
          arrivalDelay
          departureDelay
          headsign
          pickupType
          dropoffType
          realtime
          realtimeArrival
          realtimeDeparture
          realtimeState
          scheduledArrival
          scheduledDeparture
          serviceDay
          platformColor
          stop {
            id: gtfsId
            platformCode
            timezone
          }
          timepoint
          trip {
            id
            gtfsId
            bikesAllowed
            tripShortName
            tripHeadsign
            wheelchairAccessible
            stops {
              gtfsId
              name(language: $language)
            }
            infoServices(language: $language, onlyDisplayable: true) {
              name
              fontCode
              displayable
              fontCharSet
              fromStopIndex
              tillStopIndex
              fromStop {
                id: gtfsId
                name
                timezone
              }
              tillStop {
                id: gtfsId
                name
                timezone
              }
            }
          }
        }
      }
      services {
        id
        name
        fontCode
        fontCharSet
        displayable
      }
    }
  }
`;

export const TRIP_QUERY = /* GraphQL */ `
  query Trip($id: String!, $serviceDay: String, $language: String) {
    trip(id: $id, serviceDay: $serviceDay) {
      id: gtfsId
      alerts(types: [ROUTE, TRIP]) {
        alertHash
        alertUrl
        alertCause
        alertEffect
        alertHeaderText
        alertSeverityLevel
        alertDescriptionText
        alertUrlTranslations {
          language
          text
        }
        alertHeaderTextTranslations {
          language
          text
        }
        alertDescriptionTextTranslations {
          text
          language
        }
        id
        effectiveStartDate
        effectiveEndDate
        feed
      }
      pattern {
        id
        headsign
        stops {
          id: gtfsId
          name
          lat
          lon
        }
      }
      serviceDescriptions(language: $language)
      infoServices(language: $language, onlyDisplayable: true) {
        name
        fontCode
        displayable
        fontCharSet
        fromStopIndex
        tillStopIndex
        fromStop {
          id: gtfsId
          name
          timezone
        }
        tillStop {
          id: gtfsId
          name
          timezone
        }
      }
      route {
        id: gtfsId
        mode
        alerts(types: [STOPS_ON_ROUTE]) {
          alertHash
          alertUrl
          alertCause
          alertEffect
          alertHeaderText
          alertSeverityLevel
          alertDescriptionText
          alertUrlTranslations {
            language
            text
          }
          alertHeaderTextTranslations {
            language
            text
          }
          alertDescriptionTextTranslations {
            text
            language
          }
          id
          effectiveStartDate
          effectiveEndDate
          feed
        }
        agency {
          id: gtfsId
          name
          url
          timezone
          lang
          phone
          fareUrl
        }
        shortName
        longName
        type
        url
        color
        textColor
        routeBikesAllowed: bikesAllowed
        bikesAllowed
        patterns {
          id
        }
      }
      tripShortName
      tripHeadsign
      serviceId
      directionId
      blockId
      shapeId
      wheelchairAccessible
      bikesAllowed
      tripBikesAllowed: bikesAllowed
      stoptimes {
        headsign
        stop {
          timezone
        }
        scheduledArrival
        realtimeArrival
        arrivalDelay
        scheduledDeparture
        realtimeDeparture
        departureDelay
        pickupType
        dropoffType
        timepoint
        realtime
        realtimeState
        serviceDay
        platformColor
        stop {
          alerts(types: [STOP_ON_ROUTES, STOP_ON_TRIPS, STOP]) {
            alertHash
            alertUrl
            alertCause
            alertEffect
            alertHeaderText
            alertSeverityLevel
            alertDescriptionText
            alertUrlTranslations {
              language
              text
            }
            alertHeaderTextTranslations {
              language
              text
            }
            alertDescriptionTextTranslations {
              text
              language
            }
            id
            effectiveStartDate
            effectiveEndDate
            feed
          }
          id: gtfsId
          stopId: gtfsId
          platformCode
          code
          name
          lat
          lon
          geometries {
            geoJson
          }
        }
      }
      tripGeometry {
        length
        points
      }
      isThroughCoach
      vehiclePositions {
        stopRelationship {
          status
          stop {
            gtfsId
            name
          }
        }
        vehicleId
        lat
        lon
        heading
        speed
        lastUpdated
        label
        trip {
          id
          gtfsId
        }
        nextStop {
          arrivalDelay
          stop {
            name
          }
        }
        prevOrCurrentStop {
          arrivalDelay
          departureDelay
        }
      }
    }
  }
`;

// Kept separate so unsupported optional schedule fields cannot break route loading.
export const ROUTE_PATTERN_TRIPS_QUERY = /* GraphQL */ `
  query RoutePatternTrips($id: String!, $serviceDay: String!) {
    route(id: $id) {
      patterns {
        id
        tripsForDate(serviceDate: $serviceDay) {
          id: gtfsId
          departureStoptime {
            scheduledDeparture
          }
        }
      }
    }
  }
`;

export const ROUTE_QUERY = /* GraphQL */ `
  query Route($id: String!, $serviceDay: String) {
    route(id: $id) {
      alerts(types: [STOPS_ON_ROUTE], serviceDay: $serviceDay) {
        alertHash
        alertUrl
        alertCause
        alertEffect
        alertHeaderText
        alertSeverityLevel
        alertDescriptionText
        alertUrlTranslations {
          language
          text
        }
        alertHeaderTextTranslations {
          language
          text
        }
        alertDescriptionTextTranslations {
          text
          language
        }
        id
        effectiveStartDate
        effectiveEndDate
        feed
      }
      id: gtfsId
      desc
      agency {
        id: gtfsId
        name
        url
        timezone
        lang
        phone
      }
      longName
      shortName
      mode
      type
      color
      textColor
      bikesAllowed
      routeBikesAllowed: bikesAllowed
      url
      patterns {
        id
        headsign
        fromStopName
        name
        trips {
          tripShortName
        }
        patternGeometry {
          points
          length
        }
        stops {
          code
          platformCode
          id: gtfsId
          lat
          lon
          name
          locationType
          geometries {
            geoJson
          }
          routes {
            textColor
            color
          }
          alerts(types: [STOP_ON_ROUTES, STOP_ON_TRIPS, STOP], serviceDay: $serviceDay) {
            alertHash
            alertUrl
            alertCause
            alertEffect
            alertHeaderText
            alertSeverityLevel
            alertDescriptionText
            alertUrlTranslations {
              language
              text
            }
            alertHeaderTextTranslations {
              language
              text
            }
            alertDescriptionTextTranslations {
              text
              language
            }
            id
            effectiveStartDate
            effectiveEndDate
            feed
          }
        }
        alerts(types: [ROUTE], serviceDay: $serviceDay) {
          alertHash
          alertUrl
          alertCause
          alertEffect
          alertHeaderText
          alertSeverityLevel
          alertDescriptionText
          alertUrlTranslations {
            language
            text
          }
          alertHeaderTextTranslations {
            language
            text
          }
          alertDescriptionTextTranslations {
            text
            language
          }
          id
          effectiveStartDate
          effectiveEndDate
          feed
        }
        vehiclePositions {
          vehicleId
          uicCode
          licensePlate
          label
          lat
          lon
          vehicleModel
          isEstimated
          stopRelationship {
            status
            stop {
              name
              gtfsId
            }
            arrivalTime
            departureTime
          }
          nextStop {
            stop {
              name
            }
            arrivalDelay
          }
          prevOrCurrentStop {
            arrivalDelay
            departureDelay
          }
          speed
          heading
          lastUpdated
          trip {
            tripHeadsign
            tripShortName
            id
            gtfsId
            routeShortName
            activeDates
            serviceId
            pattern {
              id
            }
          }
        }
      }
    }
  }
`;

/**
 * Build the anonymous `vehiclePositions` bounding-box query.
 *
 * The official client inlines `swLat`/`swLon`/`neLat`/`neLon`/`modes` as
 * literals, so the query is assembled with interpolated values. `modes` are
 * GraphQL enum literals and are strictly validated.
 */
export function vehiclePositionsBBoxQuery(bounds: {
  swLat: number;
  swLon: number;
  neLat: number;
  neLon: number;
  modes: Mode[];
}): string {
  const { swLat, swLon, neLat, neLon, modes } = bounds;
  const modeList = modes.map((m) => {
    if (!/^[A-Z_]+$/.test(m)) {
      throw new Error(`Invalid transport mode: ${JSON.stringify(m)}`);
    }
    return m;
  });
  return `{
  vehiclePositions(
    swLat: ${swLat}
    swLon: ${swLon}
    neLat: ${neLat}
    neLon: ${neLon}
    modes: [${modeList.join(',')}]
  ) {
    vehicleId
    isEstimated
    lat
    lon
    heading
    vehicleModel
    label
    licensePlate
    uicCode
    lastUpdated
    speed
    stopRelationship {
      status
      stop {
        gtfsId
        name
      }
      arrivalTime
      departureTime
    }
    trip {
      id
      gtfsId
      routeShortName
      tripHeadsign
      tripShortName
      route {
        id: gtfsId
        mode
        shortName
        longName
        textColor
        color
      }
      pattern {
        id
      }
      serviceDate
    }
    nextStop {
      arrivalDelay
      stop {
        name
      }
    }
    prevOrCurrentStop {
      scheduledArrival
      realtimeArrival
      arrivalDelay
      scheduledDeparture
      realtimeDeparture
      departureDelay
    }
  }
}
`;
}

export const VEHICLE_POSITIONS_FOR_TRIPS_QUERY = /* GraphQL */ `
  query GetVehiclePositionsForTrips($trips: [TripKey]) {
    vehiclePositionsForTrips(trips: $trips) {
      vehicleId
      lat
      lon
      heading
      label
      uicCode
      licensePlate
      lastUpdated
      speed
      stopRelationship {
        status
        stop {
          gtfsId
          name
        }
        arrivalTime
        departureTime
      }
      nextStop {
        arrivalDelay
        stop {
          name
        }
      }
      prevOrCurrentStop {
        arrivalDelay
        departureDelay
      }
      trip {
        id
        gtfsId
        routeShortName
        tripHeadsign
        tripShortName
        route {
          mode
          shortName
          longName
          textColor
          color
        }
        pattern {
          id
        }
      }
    }
  }
`;

export const NEAREST_QUERY = /* GraphQL */ `
  query Nearest(
    $lat: Float!
    $lon: Float!
    $maxDistance: Int
    $maxResults: Int
    $filterByPlaceTypes: [FilterPlaceType]
  ) {
    nearest(
      lat: $lat
      lon: $lon
      maxDistance: $maxDistance
      maxResults: $maxResults
      filterByPlaceTypes: $filterByPlaceTypes
    ) {
      edges {
        node {
          place {
            id
            lat
            lon
            __typename
            ... on RentalVehicle {
              network
              vehicleType {
                formFactor
              }
            }
            ... on VehicleRentalStation {
              network
            }
            ... on BikeRentalStation {
              bikesAvailable
              spacesAvailable
              name
              networks
            }
            ... on VehicleParking {
              carPlaces
              bicyclePlaces
              name
            }
          }
          distance
        }
      }
    }
  }
`;

export const STOP_GROUPS_BY_RADIUS_QUERY = /* GraphQL */ `
  query StopGroupsByRadius(
    $lat: Float!
    $lon: Float!
    $radius: Int!
    $stopId: String
    $ignoredStopClusterId: String
    $ignoredStopGroupId: String
    $startTime: Long
  ) {
    stopGroupsByRadius(
      lat: $lat
      lon: $lon
      radius: $radius
      stopId: $stopId
      ignoredStopClusterId: $ignoredStopClusterId
      ignoredStopGroupId: $ignoredStopGroupId
    ) {
      edges {
        node {
          stop {
            id: gtfsId
            code
            lat
            lon
            name
            zoneId
            geometries {
              geoJson
            }
            routes {
              id: gtfsId
              agency {
                gtfsId
                name
                url
              }
              longName
              mode
              color
              textColor
              shortName
            }
            stopTimes: stoptimesForPatterns(startTime: $startTime, numberOfDepartures: 500) {
              pattern {
                desc: name
                headsign
                id: code
                fromStopName
                route {
                  id
                  desc
                  color
                  textColor
                  mode
                  shortName
                  longName
                }
              }
              times: stoptimes {
                headsign
                pickupType
                dropoffType
                serviceDay
                timepoint
                trip {
                  id
                  gtfsId
                  tripShortName
                  tripHeadsign
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** Default transport modes for realtime vehicle filters (matches the web client). */
export const DEFAULT_VEHICLE_MODES: Mode[] = [
  'RAIL',
  'RAIL_REPLACEMENT_BUS',
  'SUBURBAN_RAILWAY',
  'TRAMTRAIN',
];

export const SEARCH_TRIPS_QUERY = /* GraphQL */ `
  query SearchTrips(
    $searchString: String!
    $modes: [TransitMode]
    $agencyIds: [String]
    $countryIsoCodes: [String]
    $date: String!
  ) {
    searchTrips(
      searchString: $searchString
      modes: $modes
      agencyIds: $agencyIds
      countryIsoCodes: $countryIsoCodes
      date: $date
    ) {
      id
      gtfsId
      tripHeadsign
      tripShortName
      route {
        id
        gtfsId
        agency {
          id
          gtfsId
          name
        }
        longName
        shortName
        mode
        type
        color
        textColor
      }
    }
  }
`;
