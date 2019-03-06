/* @flow */
export type GenericEventHandlerT = (SyntheticEvent<>) => void;
export type VoidFuncT = (...any) => void;
export type noopT = () => void | Promise<void>;