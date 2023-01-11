import { ELTYPE } from '@src/components/docs/plugins/config';

export const getCardInnerContentWhenCopy = (fragment, setFragment) => {
  const children = (fragment[0] as any).children;
  const cardCenter = children?.length >= 1 && (children as any[]).find(child => [ELTYPE.TABLE, ELTYPE.ALERTS].includes(child.type));
  switch (cardCenter.type) {
    case ELTYPE.TABLE: {
      const isSingleTableRow = cardCenter.children?.length === 1 && cardCenter.children[0].type === ELTYPE.TABLE_ROW;
      if (isSingleTableRow) {
        const tableRow = cardCenter.children[0];
        const isSingleTableCell = tableRow.children?.length === 1 && tableRow.children[0].type === ELTYPE.TABLE_CELL;
        if (isSingleTableCell) {
          const tableCell = tableRow.children[0];
          if (tableCell) {
            setFragment(tableCell.children);
          }
        }
      }
    }
    case ELTYPE.ALERTS: {
      const isSingleAlertDescription = cardCenter.children?.length === 1 && cardCenter.children[0].type === ELTYPE.ALERTDESCRIPTION;
      if (isSingleAlertDescription) {
        const alertDescription = cardCenter.children[0];
        if (alertDescription) {
          setFragment(alertDescription.children);
        }
      }
    }
  }
};
