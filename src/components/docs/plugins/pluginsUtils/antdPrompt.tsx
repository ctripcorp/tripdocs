import { Form, Input, Modal } from 'antd';
import { Rule } from 'antd/es/form';
import { ModalProps } from 'antd/es/modal';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReactDOM from 'react-dom';

interface Props {
  rules?: Rule[];
  placeholder?: string;
  ref?: any;
  onPressEnter?: () => void;
}

const PromptForm = forwardRef(({ rules, placeholder, onPressEnter }: Props, ref: any) => {
  const value = useRef();

  useImperativeHandle(ref, () => ({
    getValue: () => value.current,
  }));

  return (
    <Form
      onValuesChange={(_: any, values: any) => {
        value.current = values.input;
      }}
    >
      <Form.Item name="input" rules={rules}>
        <Input placeholder={placeholder} onPressEnter={onPressEnter} />
      </Form.Item>
    </Form>
  );
});

interface PromptConfig {
  title: string;
  rules?: Rule[];
  placeholder?: string;
  modalProps?: Partial<ModalProps>;
}

interface PromptProps extends Props {
  modalProps?: Partial<ModalProps>;
  visible: boolean;
  close: (value?: string) => void;
  title: string;
  afterClose?: () => void;
}

function Prompt({ rules, placeholder, modalProps = {}, visible, close, title, afterClose }: PromptProps) {
  const formRef = useRef<any>(null);
  const handleOk = async () => {
    try {
      const value = await formRef.current?.getValue();
      close(value);
    } catch (e) {}
  };
  return (
    <Modal {...modalProps} visible={visible} onOk={handleOk} onCancel={() => close()} title={title} getContainer={false} afterClose={afterClose}>
      <PromptForm ref={formRef} rules={rules} placeholder={placeholder} onPressEnter={handleOk} />
    </Modal>
  );
}

export default function prompt(config: PromptConfig) {
  return new Promise((resolve, reject) => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    let currentConfig: PromptProps = { ...config, close, visible: true };

    const destroy = (value?: string) => {
      const unmountResult = ReactDOM.unmountComponentAtNode(div);
      if (unmountResult && div.parentNode) {
        div.parentNode.removeChild(div);
      }
      if (value !== undefined) {
        resolve(value);
      } else {
        reject(value);
      }
    };

    function render(props: PromptProps) {
      ReactDOM.render(<Prompt {...props} />, div);
    }

    function close(value?: string) {
      currentConfig = {
        ...currentConfig,
        visible: false,
        afterClose: () => destroy(value),
      };
      render(currentConfig);
    }

    render(currentConfig);
  });
}
