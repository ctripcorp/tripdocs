import styled from '@emotion/styled';
import { isRGBLight } from '../../../utils/hexColorUtils';

export const RoomWrapper = styled.div`
  padding-bottom: 10px;
  border-bottom: 2px solid #e8e8e8;
`;

export const H4 = styled.h4`
  margin: 0;
  padding-right: 10px;
`;

export const Input = styled.input`
  padding: 6px 14px;
  font-size: 14px;
  margin-top: 10px;
  margin-bottom: 10px;
  min-width: 240px;
  outline: none;
  border: 2px solid palevioletred;
  margin-right: auto;
`;

export const Button = styled.button`
  padding: 6px 14px;
  display: block;
  outline: none;
  background-color: transparent;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  & + button {
    margin-left: 10px;
  }
`;

export const COLOR_DEFAULT = { COLOR: '#4A535D', HOVER_BG_COLOR: '#F2F4F6' };
export const COLOR_ACTIVE = { COLOR: 'rgb(50, 100, 255)', BG_COLOR: 'rgba(50, 100, 255, 0.1)' };
export const COLOR_DISABLED = { COLOR: '#8090A2' };

export const IconButton = styled(Button)((props: any) => ({
  cursor: props.disabled ? 'not-allowed !important' : 'pointer',
  color: props.cellBgColor && !isRGBLight(props.cellBgColor) ? 'rgb(255, 255, 255)' : props.active ? COLOR_ACTIVE.COLOR : COLOR_DEFAULT.COLOR,
  backgroundColor: props.thiscolor ? props.thiscolor : props.active ? COLOR_ACTIVE.BG_COLOR : 'transparent',
  border: 'none',
  padding: 0,
  '&::after': {
    content: '""',
    width: '20px',
    height: props.cellBgColor ? '20px' : '2.5px',
    zIndex: props.cellBgColor ? -1 : null,
    borderRadius: '2px',
    background: props.cellBgColor ? props.cellBgColor : props.backgroundColor ? props.backgroundColor : props.fontColor ? props.fontColor : null,
    display: props.fontColor || props.backgroundColor || props.cellBgColor ? null : 'none',
    position: 'absolute',
    transform: props.cellBgColor ? 'translate(0)' : 'translateY(9px)',
  },
}));

export const IconBtn = styled.div``;

export const Grid = styled.div`
  display: grid;
  grid-gap: 0.5vw;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  @media (max-width: 767px) {
    flex-wrap: wrap;
  }
`;

export const Instance = styled.div<{ online: boolean }>`
  background: ${props => (props.online ? 'rgba(128, 128, 128, 0.1)' : 'rgba(247, 0, 0, 0.2)')};
  padding: 20px 20px 30px;
`;
export const H1 = styled.h1`
  font-size: 26px;
`;

export const H2 = styled.h2`
  font-size: 22px;
`;
export const H3 = styled.h3`
  font-size: 20px;
`;

export const HFour = styled.h4`
  font-size: 18px;
`;
export const H5 = styled.h5`
  font-size: 16px;
`;

export const H6 = styled.h6`
  font-size: 16px;
`;

export const Italic = styled.em`
  font-style: italic;
`;

export const Ul = styled.ul`
  margin-left: 10px;
  padding-left: 10px;
`;

export const Ol = styled.ol`
  margin-left: 10px;
  padding-left: 10px;
`;

export const Blockquote = styled.blockquote`
  border-left: 2px solid #ddd;
  margin-left: 0;
  margin-right: 0;
  padding-left: 10px;
  color: #aaa;
`;

export const ClientFrame = styled.div`
  position: relative !important;
  align-self: start !important;
  grid-column: 2 !important;
  grid-row: 1 !important;
  max-width: 936px;
  width: 100%;
  background-color: #fff;
  padding: 10px;
  min-height: 100%;
`;

export const TitleInput = styled.input`
  margin-left: 32px;
  border: none;
  font-size: 32px;
  font-weight: bold;
  outline: none;
`;

export const TodoListContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & + & {
    margin-top: 0;
  }
  .checkbox-span {
    margin-right: 0.75em;
    width: 20px;
    height: 20px;
  }
`;

export const TodoListText = styled.span`
  flex: 1;
  &:focus {
    outline: none;
  }
`;

export const HoverMenu = styled.div`
  & > * + * {
    margin-left: 15px;
  }
  & > button {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background-color: ${COLOR_DEFAULT.HOVER_BG_COLOR};
    }
    & > [class^='Tripdocs-'],
    [class*=' Tripdocs-'] {
      font-size: 18px;
    }
  }
  display: flex;
  padding: 6px;
  position: absolute;
  z-index: 1;
  top: -10000px;
  left: -10000px;
  margin-top: -6px;
  opacity: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.2);
  border: 1px solid #dee0e3;
`;

export const PlaceHolder = styled.div<{ size: any; header: boolean }>`
  color: #eeeeee;
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -o-user-select: none;
  user-select: none;
  font-size: ${props => props.size};
  font-weight: ${props => (props.header ? 'bold' : 'normal')};
`;

export const SiderMemuPlus = styled.div`
  color: rgba(0, 0, 0, 0.55);
  width: 24px;
  height: 24px;

  font-size: 20px;
  cursor: grab;
  span {
    cursor: grab !important;
  }
  &:hover span {
    color: #3370ff;
  }
`;
export const SiderMemuDelete = styled.div`
  color: rgba(0, 0, 0, 0.55);
  &:hover div {
    color: rgb(245, 74, 69);
    cursor: pointer;
  }
`;
