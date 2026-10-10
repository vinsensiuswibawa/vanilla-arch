import { create } from "zustand";

export type Phase = "gate" | "entering" | "showroom";

interface ArcadeState {
  phase: Phase;
  sound: boolean;
  /** Index of the car nearest the viewport's centre. */
  centered: number;
  /** True once the centred car has come to rest inside the centre band. */
  settled: boolean;
  indexOpen: boolean;
  /** Opened or closed from the keyboard (I or Esc): shortcuts get no animation, so it is instant. */
  indexByKey: boolean;
  /** The slug of the open listing, from the URL; null on the showroom. */
  listing: string | null;
  /** True while the open detail page has attached its full-viewport slot, so the stage can draw its car into it. */
  detailReady: boolean;
  setDetailReady: (ready: boolean) => void;
  /** Which cars' models have finished loading, in lineup order. */
  loaded: boolean[];
  /** How many cars, in lineup order, may stream their models in. */
  streamed: number;
  /**
   * Record mode (?record): every car loads and warms behind the gate at once, and the gate holds its
   * Enter buttons until all of them are ready, so a screen recording never catches a car arriving.
   */
  record: boolean;
  setRecord: () => void;
  setPhase: (phase: Phase) => void;
  setSound: (sound: boolean) => void;
  setCentered: (centered: number) => void;
  setSettled: (settled: boolean) => void;
  setIndexOpen: (open: boolean, byKey?: boolean) => void;
  setListing: (slug: string | null) => void;
  markLoaded: (index: number) => void;
}

export const CAR_COUNT = 13;
/** The first three cars load behind the gate (FR-01); the rest stream in one by one. */
const PRELOAD = 3;

export const useArcade = create<ArcadeState>()((set) => ({
  phase: "gate",
  sound: true,
  centered: 0,
  settled: false,
  indexOpen: false,
  indexByKey: false,
  listing: null,
  detailReady: false,
  setDetailReady: (detailReady) => set({ detailReady }),
  loaded: Array<boolean>(CAR_COUNT).fill(false),
  streamed: PRELOAD,
  record: false,
  setRecord: () => set({ record: true, streamed: CAR_COUNT }),
  setPhase: (phase) => set({ phase }),
  setSound: (sound) => set({ sound }),
  setCentered: (centered) => set({ centered }),
  setSettled: (settled) => set({ settled }),
  setIndexOpen: (indexOpen, byKey) => set({ indexOpen, indexByKey: Boolean(byKey) }),
  setListing: (listing) => set({ listing }),
  markLoaded: (index) =>
    set((state) => {
      if (state.loaded[index]) return state;
      const loaded = state.loaded.slice();
      loaded[index] = true;
      // Once everything allowed so far has arrived, let the next car in line start.
      const ready = loaded.slice(0, state.streamed).every(Boolean);
      return { loaded, streamed: ready ? Math.min(CAR_COUNT, state.streamed + 1) : state.streamed };
    }),
}));
