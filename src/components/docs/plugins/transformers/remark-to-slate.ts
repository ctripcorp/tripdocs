import { mdastToSlate } from '../transformers/mdast-to-slate';

export default function plugin() {
  this.Compiler = function (node: any) {
    return mdastToSlate(node);
  };
}
