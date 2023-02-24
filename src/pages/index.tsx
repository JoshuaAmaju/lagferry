import "mapbox-gl/dist/mapbox-gl.css";

import { Layout } from "@/common/components/layout";
import { SideNav } from "@/common/components/sidenav";
import Head from "next/head";

// @ts-ignore
import * as io from "socket.io-client";

import Map, { Layer, MapRef, Marker, Source } from "react-map-gl";

import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionSsr } from "iron-session/next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { constNull, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";

import { get_http as get_api_http } from "@/common/http";

import { Env } from "@/core/types/env";

import {
  Feature as VesselFeature,
  FeatureCollection as VesselFeatureCollection,
  get_vessel_locations,
} from "@/core/usecases/vessel";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { inspect } from "util";

import { format, formatDistanceToNow } from "date-fns";

import AnchorIcon from "@/assets/anchor.svg";
import ShipIcon from "@/assets/ship.svg";
import StackIcon from "@/assets/stack-fill.svg";
import FilterIcon from "@/assets/filter-fill.svg";

import {
  Feature as TerminalFeature,
  FeatureCollection as TerminalFeatureCollection,
  get_terminal_locations,
} from "@/core/usecases/terminal";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  FocusLock,
  FormControl,
  FormLabel,
  IconButton,
  Popover,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Select,
  Tag,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";

import styles from "@/styles/home.module.css";
import { useQuery } from "react-query";

import { FeatureCollection as NetworkFeatureCollection } from "@/core/usecases/network";

type Props = Pick<Env, "mapbox"> & {
  data: E.Either<
    string,
    {
      vessels: VesselFeatureCollection;
      terminals: TerminalFeatureCollection;
    }
  >;
};

export const getServerSideProps = withIronSessionSsr(({ req, res }) => {
  const { auth } = req.session as any;

  // console.log(auth);

  const env = get_env();

  const http = get_http_with_token_refresh(() => get_http(env))(auth)(
    (newAuth) => {
      console.log("refresh", newAuth);
    }
  );

  const run = pipe(
    TE.fromEither(http),
    TE.chain((http) => {
      return pipe(
        TE.Do,
        TE.bind("vessels", () => get_vessel_locations(http)),
        TE.bind("terminals", () => get_terminal_locations(http))
      );
    })
  );

  return run().then(
    E.matchW(
      (err) => {
        console.log("error", err);

        return err instanceof Error
          ? { props: { error: E.left(err.message) } }
          : err?.status === 401
          ? {
              redirect: {
                destination: `/auth/login?continue_to=${req.url}`,
              },
            }
          : { props: { error: E.left("An error occurred") } };
      },
      (result) => {
        // console.log("result", inspect(result, false, Infinity));
        return {
          props: {
            data: E.right(result),
            mapbox: { api_key: env.mapbox.api_key },
          },
        } as any;
      }
    )
  );
}, get_sessionConfig());

const initial_location = {
  longitude: -122.4,
  latitude: 37.8,
  zoom: 14,
};

const socket_url = "ws://34.172.18.184:8081/app?token=abc123";

export default function Home({ mapbox, data }: Props) {
  const [map, set_map] = useState<MapRef | null>(null);

  const router = useRouter();

  const { type, selected } = router.query;

  const _type =
    typeof type === "string"
      ? (type as (VesselFeature | TerminalFeature)["properties"]["layer"])
      : null;

  const _selected =
    typeof selected === "string"
      ? (parseInt(selected) as
          | VesselFeature["properties"]["vessel_id"]
          | TerminalFeature["properties"]["id"])
      : null;

  const selected_feature = useMemo(() => {
    return pipe(
      data,
      E.chain((d) => {
        return pipe(
          O.Do,
          O.bind("type", () => O.fromNullable(_type)),
          O.bind("selected", () => O.fromNullable(_selected)),
          E.fromOption(() => "No selected vessel or terminal"),
          E.map(({ type, selected }) => {
            return type === "vessel"
              ? pipe(
                  d.vessels.features,
                  A.findFirst((f) => f.properties.vessel_id === selected)
                )
              : pipe(
                  d.terminals.features,
                  A.findFirst((f) => f.properties.id === selected)
                );
          })
        );
      })
    );
  }, [data, _type, _selected]);

  const bounds_fitted = useRef(false);

  const [symbol_id, set_symbol_id] = useState<string>();

  const [socket] = useState(() => {
    return io(socket_url, { upgrade: true, transports: ["websocket"] });
  });

  const networks = useQuery({
    queryKey: ["networks"],
    refetchInterval: false,
    async queryFn() {
      const http = get_api_http();
      const { data } = await http.get<NetworkFeatureCollection>("/network");
      return data;
    },
  });

  // console.log("network", networks.data, networks.error);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("connect_error", (err: any) => {
      console.log("connect error", err);

      // if (err.message === "invalid credentials") {
      //   socket.auth.token = "efgh";
      //   socket.connect();
      // }
    });

    socket.on("location", (ev: any) => {
      console.log(ev);
    });
  }, [socket]);

  useEffect(() => {
    if (map && !bounds_fitted.current) {
      pipe(
        data,
        E.match(
          () => {},
          ({ vessels }) => {
            const bounds = new mapboxgl.LngLatBounds();

            vessels.features.forEach((feature) => {
              const { coordinates } = feature.geometry;
              bounds.extend(coordinates);
            });

            map.fitBounds(bounds, { animate: false });

            bounds_fitted.current = true;
          }
        )
      );
    }
  }, [map, data, bounds_fitted]);

  useEffect(() => {
    if (map) {
      map.on("mouseenter", ["vessel-icons"], () => {
        map.getCanvas().style.cursor = "pointer";
      });

      // Change it back to a pointer when it leaves.
      map.on("mouseleave", ["vessel-icons"], () => {
        map.getCanvas().style.cursor = "";
      });

      // map.on("click", "vessel", (e) => {
      //   map.flyTo({ center: e.features?.[0].geometry?.coordinates });
      // });
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      pipe(
        selected_feature as E.Either<string, O.Option<any>>,
        E.match(
          () => {},
          O.match(
            () => {},
            ({ geometry }) => {
              const [lng, lat] = geometry.coordinates;
              map.flyTo({ zoom: 16, center: [lng, lat] });
            }
          )
        )
      );
    }
  }, [map, selected_feature]);

  // console.log(data);

  const vessel_img = useQuery(
    ["vessel image"],
    () => {
      return new Promise<HTMLImageElement | ImageBitmap | undefined>(
        (resolve, reject) => {
          map!.loadImage("/ship-fill.png", (err, img) => {
            if (err) return reject(err);
            resolve(img);
          });
        }
      );
    },
    {
      enabled: map !== null,
      refetchInterval: false,
      onSuccess(img) {
        if (img) map!.addImage("lag-vessel", img);
      },
    }
  );

  const vessel_markers = useMemo(() => {
    return pipe(
      data,
      E.match(constNull, ({ vessels }) => {
        return pipe(
          vessels.features,
          A.map((feature) => {
            const { geometry } = feature;
            const props = feature.properties;
            const [lng, lat] = geometry.coordinates;

            return (
              <Marker
                latitude={lat}
                longitude={lng}
                anchor="bottom"
                key={props.vessel_id}
                onClick={() => {
                  router.push(
                    `?type=${props.layer}&selected=${props.vessel_id}`
                  );
                }}
              >
                <ShipIcon />
              </Marker>
            );
          })
        );
      })
    );
  }, [data, router]);

  const terminal_markers = useMemo(() => {
    return pipe(
      data,
      E.match(constNull, ({ terminals }) => {
        return pipe(
          terminals.features,
          A.map((feature) => {
            const { geometry } = feature;
            const props = feature.properties;
            const [lng, lat] = geometry.coordinates;

            return (
              <Marker
                key={props.id}
                latitude={lat}
                longitude={lng}
                anchor="bottom"
                onClick={() => {
                  router.push(`?type=${props.layer}&selected=${props.id}`);
                }}
              >
                <AnchorIcon />
              </Marker>
            );
          })
        );
      })
    );
  }, [data, router]);

  return (
    <>
      <Head>
        <title>LagFerry eTrack</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout className="h-full">
        <SideNav />

        <main className="flex-1 h-full">
          {pipe(
            mapbox.api_key,
            O.match(
              () => <></>,
              (api_key) => {
                return (
                  <div className="h-full">
                    <Map
                      key="map"
                      reuseMaps
                      ref={set_map}
                      mapboxAccessToken={api_key}
                      initialViewState={initial_location}
                      mapStyle="mapbox://styles/mapbox/streets-v9"
                      onLoad={(e) => {
                        const map = e.target;

                        const layers = map.getStyle().layers;
                        // Find the index of the first symbol layer in the map style.

                        let firstSymbolId;

                        for (const layer of layers) {
                          if (layer.type === "symbol") {
                            firstSymbolId = layer.id;
                            break;
                          }
                        }

                        if (firstSymbolId) {
                          set_symbol_id(firstSymbolId);
                        }

                        // map.loadImage("/ship-fill.png", (err, img) => {
                        //   if (img) map.addImage("vessel", img);
                        // });

                        // pipe(
                        //   data,
                        //   E.match(
                        //     () => {},
                        //     ({ features }) => {
                        //       features.forEach((feature) => {
                        //         const { properties } = feature;

                        //         if (properties.image) {
                        //           map.loadImage(
                        //             properties.image,
                        //             (err, img) => {
                        //               if (img) {
                        //                 map.addImage(properties.name, img);
                        //               }
                        //             }
                        //           );
                        //         }
                        //       });
                        //     }
                        //   )
                        // );
                      }}
                    >
                      {pipe(
                        O.fromNullable(networks.data),
                        O.match(constNull, (data) => {
                          return (
                            <Source
                              lineMetrics
                              id="networks"
                              type="geojson"
                              key="networks"
                              data={data as any}
                            >
                              {/* <Layer
                                  {...{
                                    type: "line",
                                    id: "outline",
                                    beforeId: symbol_id,
                                    // layout: {},
                                    paint: {
                                      "line-width": 0.1,
                                      "line-color": "#00000030",
                                    },
                                  }}
                                /> */}

                              <Layer
                                {...{
                                  id: "colors",
                                  type: "fill",
                                  beforeId: symbol_id,
                                  paint: {
                                    "fill-opacity": 0.85,
                                    "fill-color": [
                                      "interpolate",
                                      ["linear"],
                                      ["coalesce", ["get", "mtn_upload_mb"], 0],
                                      -1,
                                      "black",
                                      0.00001,
                                      "red",
                                      8.00001,
                                      "yellow",
                                      16,
                                      "green",
                                    ],
                                  },
                                }}
                              />
                            </Source>
                          );
                        })
                      )}

                      {pipe(
                        data,
                        E.match(constNull, (data) => {
                          return (
                            <>
                              {vessel_img.isSuccess ? (
                                <Source
                                  id="vessel"
                                  type="geojson"
                                  data={data.vessels}
                                >
                                  {/* <Layer
                                  type="circle"
                                  id="vessel-point"
                                  paint={{
                                    "circle-radius": 15,
                                    "circle-color": "#007cbf",
                                  }}
                                /> */}

                                  <Layer
                                    {...{
                                      type: "symbol",
                                      id: "vessel-icons",
                                      layout: {
                                        "text-size": 14,
                                        "text-anchor": "top",
                                        "text-offset": [0, 0.8],
                                        "icon-image": "lag-vessel",
                                        "text-field": [
                                          "to-string",
                                          ["get", "name"],
                                        ],
                                      },
                                    }}
                                  />

                                  {/* <Layer
                                  {...{
                                    id: "label",
                                    type: "symbol",
                                    layout: {
                                      // "text-justify": "right",
                                      // "text-allow-overlap": true,
                                      "text-justify": "auto",
                                      "text-radial-offset": 0.5,
                                      "text-field": ["get", "name"],
                                      "text-variable-anchor": [
                                        "top",
                                        "bottom",
                                        "left",
                                        "right",
                                      ],
                                    },
                                  }}
                                /> */}
                                </Source>
                              ) : null}

                              {/* {vessel_markers}

                              {terminal_markers} */}

                              {/* {pipe(
                                  data.vessels.features,
                                  A.map((f) => {
                                    const { properties: props, geometry } = f;
                                    const { coordinates } = geometry;
                                    const [lng, lat] = coordinates;

                                    return (
                                      <Marker
                                        latitude={lat}
                                        longitude={lng}
                                        anchor="bottom"
                                        key={props.vessel_id}
                                        onClick={() => {
                                          router.push(
                                            `?type=${props.layer}&selected=${props.vessel_id}`
                                          );
                                        }}
                                      >
                                        <ShipIcon />
                                      </Marker>
                                    );
                                  })
                                )} */}

                              {/* {pipe(
                                  data.terminals.features,
                                  A.map((f) => {
                                    const { properties: props, geometry } = f;

                                    const { coordinates } = geometry;
                                    const [lng, lat] = coordinates;

                                    return (
                                      <Marker
                                        latitude={lat}
                                        longitude={lng}
                                        anchor="bottom"
                                        key={props.id}
                                        onClick={() => {
                                          router.push(
                                            `?type=${props.layer}&selected=${props.id}`
                                          );
                                        }}
                                      >
                                        <AnchorIcon />
                                      </Marker>
                                    );
                                  })
                                )} */}
                            </>
                          );
                        })
                      )}
                    </Map>

                    <div className={styles.controls}>
                      <Popover placement="left">
                        <PopoverTrigger>
                          <IconButton
                            aria-label="filter"
                            icon={<FilterIcon />}
                            className={styles.control}
                          />
                        </PopoverTrigger>

                        <PopoverContent p={5}>
                          <FocusLock restoreFocus persistentFocus={false}>
                            {/* <PopoverCloseButton /> */}

                            <figure className="p-2 bg-white rounded-md space-y-6">
                              <figcaption className="text-lg font-semibold">
                                Filters
                              </figcaption>

                              <div>
                                <Accordion>
                                  <AccordionItem defaultChecked>
                                    <h2 className="text-lg font-medium">
                                      <AccordionButton>
                                        <span className="flex-1 text-left">
                                          Symbols
                                        </span>
                                        <AccordionIcon />
                                      </AccordionButton>
                                    </h2>

                                    <AccordionPanel>
                                      <FormControl>
                                        <FormLabel>Type</FormLabel>

                                        <Select>
                                          <option value="">Vessel</option>
                                          <option value="">Terminal</option>
                                        </Select>
                                      </FormControl>
                                    </AccordionPanel>
                                  </AccordionItem>

                                  <AccordionItem defaultChecked>
                                    <h2 className="text-lg font-medium">
                                      <AccordionButton>
                                        <span className="flex-1 text-left">
                                          Networks
                                        </span>
                                        <AccordionIcon />
                                      </AccordionButton>
                                    </h2>

                                    <AccordionPanel>
                                      <FormControl>
                                        <FormLabel>Type</FormLabel>

                                        <Select>
                                          <option value="">Vessel</option>
                                          <option value="">Terminal</option>
                                        </Select>
                                      </FormControl>
                                    </AccordionPanel>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </figure>
                          </FocusLock>
                        </PopoverContent>
                      </Popover>

                      <IconButton
                        aria-label="Layers"
                        icon={<StackIcon />}
                        className={styles.control}
                        onClick={() => {}}
                      />
                    </div>

                    {pipe(
                      selected_feature as any,
                      E.match(
                        constNull,
                        O.match(constNull, (feat) => {
                          const feature = feat as
                            | VesselFeature
                            | TerminalFeature;

                          const props = feature.properties;

                          return (
                            <div
                              key={"id" in props ? props.id : props.vessel_id}
                              className="bg-white z-50 fixed top-0 right-0 bottom-0 m-4 w-[25rem] rounded-md overflow-hidden"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {/* <img src={properties.image ?? ""} alt="" className="h-[10rem]" /> */}

                              <div className="absolute top-0 right-0 m-2">
                                <Button size="xs" onClick={router.back}>
                                  close
                                </Button>
                              </div>

                              <div className="flex h-full flex-col">
                                <div className="h-[15rem] bg-gray-500" />

                                <div className="p-4 space-y-6 flex-1 flex flex-col">
                                  <div className="space-y-4 flex-1">
                                    <div className="flex space-x-4 items-center">
                                      <h1 className="text-2xl font-bold">
                                        {props.name}
                                      </h1>

                                      <Tag
                                        variant="subtle"
                                        colorScheme={
                                          props.status === "ACTIVE"
                                            ? "green"
                                            : "red"
                                        }
                                      >
                                        {props.status}
                                      </Tag>
                                    </div>

                                    <div className="space-y-2">
                                      {props.layer === "vessel" ? (
                                        <>
                                          <p>
                                            <strong>Reference Number: </strong>
                                            <span>
                                              {props.reference_number}
                                            </span>
                                          </p>

                                          <p>
                                            <strong>Capacity: </strong>
                                            <span>{props.capacity}</span>
                                          </p>

                                          <p>
                                            <strong>Speed: </strong>
                                            <span>{props.speed}</span>
                                          </p>

                                          <p>
                                            <strong>GPS Time: </strong>
                                            <span>
                                              {format(
                                                new Date(props.processing_time),
                                                "dd MMMM, yyyy"
                                              )}
                                            </span>
                                          </p>

                                          <p>
                                            <strong>Received: </strong>
                                            <span>
                                              {formatDistanceToNow(
                                                new Date(props.processing_time),
                                                { addSuffix: true }
                                              )}
                                            </span>
                                          </p>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>

                                  {props.layer === "vessel" ? (
                                    <div className="sticky bottom-0">
                                      <Button
                                        as={Link}
                                        colorScheme="red"
                                        className="w-full"
                                        href={`/playback/${props.vessel_id}`}
                                      >
                                        View Playback
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                );
              }
            )
          )}
        </main>
      </Layout>
    </>
  );
}
