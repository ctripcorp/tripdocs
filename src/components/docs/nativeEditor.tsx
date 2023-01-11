import { default as React } from 'react';
import '@src/style/iconfont/Tripdocs.css';
import storage from '../../utils/storage';
import EditorFrame, { EditorProps } from './slateEditor';

interface ClientProps {
  name: string;
  id: string;
  removeUser: (id: any) => void;
  [key: string]: any;
}

const Client: React.FC<ClientProps> = props => {
  return <EditorFrame {...(props as unknown as EditorProps)} decorate={undefined} />;
};

export default Client;
