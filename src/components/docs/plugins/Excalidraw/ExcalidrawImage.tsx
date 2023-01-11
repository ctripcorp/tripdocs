import { exportToSvg } from '@excalidraw/excalidraw';
import { ExcalidrawElement, NonDeleted } from '@excalidraw/excalidraw/types/element/types';
import { AppState } from '@excalidraw/excalidraw/types/types';
import * as React from 'react';
import { useEffect, useState } from 'react';

type ImageType = 'svg' | 'canvas';

type Props = {
  appState?: Partial<Omit<AppState, 'offsetTop' | 'offsetLeft'>> | null;

  className?: string;

  elements: NonDeleted<ExcalidrawElement>[];

  height?: number | null;

  imageContainerRef: { current: null | HTMLDivElement };

  imageType?: ImageType;

  rootClassName?: string | null;

  width?: number | null;
};

const removeStyleFromSvg_HACK = svg => {
  const styleTag = svg?.firstElementChild?.firstElementChild;

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox != null) {
    const viewBoxDimentions = viewBox.split(' ');
    svg.setAttribute('width', viewBoxDimentions[2]);
    svg.setAttribute('height', viewBoxDimentions[3]);
  }

  if (styleTag && styleTag.tagName === 'style') {
    styleTag.remove();
  }
};

export default function ExcalidrawImage({ elements, imageContainerRef, appState = null, rootClassName = null, width, height }: Props): JSX.Element {
  const [Svg, setSvg] = useState<Element | null>(null);

  useEffect(() => {
    const setContent = async () => {
      const svg: Element = await exportToSvg({
        appState,
        elements,
        files: null,
      });
      removeStyleFromSvg_HACK(svg);

      svg.setAttribute('data-ignore-slate', 'true');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('display', 'block');

      setSvg(svg);
    };
    setContent();
  }, [elements, appState]);

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
      data-ignore-slate={true}
      ref={imageContainerRef}
      className={rootClassName ?? ''}
      dangerouslySetInnerHTML={{ __html: Svg?.outerHTML ?? '' }}
    />
  );
}
