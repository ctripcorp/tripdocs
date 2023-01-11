import markdown from 'remark-parse';
import slate from 'remark-slate';
import unified from 'unified';
import { ELTYPE } from '../config';

export const deserializeMD = (editor: any, content: string) => {
  const tree = unified()
    .use(markdown)
    .use(slate, {
      nodeTypes: {
        paragraph: ELTYPE.PARAGRAPH,
        block_quote: ELTYPE.BLOCK_QUOTE,
        link: ELTYPE.LINK,
        code_block: ELTYPE.CODE_BLOCK,
        ul_list: ELTYPE.ULLIST,
        ol_list: ELTYPE.OLLIST,
        listItem: ELTYPE.ULLIST,
        heading: {
          1: ELTYPE.HEADING_ONE,
          2: ELTYPE.HEADING_TWO,
          3: ELTYPE.HEADING_THREE,
          4: ELTYPE.HEADING_FOUR,
          5: ELTYPE.HEADING_FIVE,
          6: ELTYPE.HEADING_SIX,
        },
      },
      linkDestinationKey: 'href',
    })
    .processSync(content);

  return tree.result;
};
