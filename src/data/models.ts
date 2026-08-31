/** Display height for every figure: 12 cm, with the feet on the origin. */
export const MODEL_HEIGHT_METERS = 0.12;

export const DRACO_DECODER_PATH = '/draco/';

export const FIGURES = [
  {
    id: 'fer',
    url: '/3d_models/Fer_Vestido_draco.glb',
    icon: '/3d_models/icons/Fer_lego01-removebg-preview.png',
    labelKey: 'model.fer',
    background: 0x8d6d7c,
    ground: 0xa88896,
    light: false,
  },
  {
    id: 'hector',
    url: '/3d_models/Hector_Traje_draco.glb',
    icon: '/3d_models/icons/Hector_lego02-removebg-preview.png',
    labelKey: 'model.hector',
    background: 0x56434c,
    ground: 0x6a5860,
    light: false,
  },
  {
    id: 'ferCasual',
    url: '/3d_models/Fer_Casual_draco.glb',
    icon: '/3d_models/icons/Fer_lego02-removebg-preview.png',
    labelKey: 'model.ferCasual',
    background: 0xc78b58,
    ground: 0xb47c52,
    light: false,
  },
  {
    id: 'hectorCasual',
    url: '/3d_models/Hector_Casual_draco.glb',
    icon: '/3d_models/icons/Hector_lego01-removebg-preview.png',
    labelKey: 'model.hectorCasual',
    background: 0x71918d,
    ground: 0x5d7977,
    light: true,
  },
] as const;

export type FigureId = (typeof FIGURES)[number]['id'];
