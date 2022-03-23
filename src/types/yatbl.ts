// Types used within the yatbl library

export type tapi_T = (tApiMethod: string, body: object) => Record<string, any>;

export type ApiErrorHandler = (error: any) => void;

export type ShortHand = Function;
export type ShortHandConfig = { name: string; shortHand: ShortHand };
export type ShortHandArg =
  | ShortHand
  | Array<ShortHand>
  | ShortHandConfig
  | Array<ShortHandConfig>;

export type Handler = Function;

export type Callback = Function;
