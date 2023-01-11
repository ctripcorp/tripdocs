import { Operation } from '@src/components/slate-packages/slate';
import { SharedType } from '../model';

export type ApplyFunc<O extends Operation = Operation> = (
  sharedType: SharedType,
  op: O
) => SharedType;

export type OpMapper<O extends Operation = Operation> = {
  [K in O['type']]: O extends { type: K } ? ApplyFunc<O> : never;
};
