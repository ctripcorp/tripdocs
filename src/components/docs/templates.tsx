import { FileExcelTwoTone, FileTextTwoTone, FileWordTwoTone } from '@ant-design/icons';
import { Card } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';

const { Meta } = Card;

interface TemplatesProps {
  show: any;
  templateChoice: any;
}

const Templates: React.FC<TemplatesProps> = ({ show, templateChoice }) => {
  const _dailyReportOnClick = () => {
    templateChoice('dailyReport');
  };

  const _onePageTempOnClick = () => {
    templateChoice('onePageTemp');
  };

  const _meetingNotesOnClick = () => {
    templateChoice('meetingNotes');
  };

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        height: show ? 300 : 0,
        transition: 'opacity 0.5s ease-out',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: show ? 250 : 0,
          marginBottom: 20,
          marginTop: 20,
        }}
      >
        {}
        {}
        <Card
          hoverable
          style={{ width: 160, borderRadius: '8px', marginLeft: 20, marginRight: 20 }}
          cover={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 160,
                height: show ? 160 : 0,
              }}
            >
              <FileWordTwoTone style={{ fontSize: '48px' }} />
            </div>
          }
          onClick={_dailyReportOnClick}
        >
          <Meta title="工作日报模版" />
        </Card>
        {}
        <Card
          hoverable
          style={{ width: 160, borderRadius: '8px', marginLeft: 20, marginRight: 20 }}
          cover={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 160,
                height: show ? 160 : 0,
              }}
            >
              <FileExcelTwoTone twoToneColor="#16b548" style={{ fontSize: '48px' }} />
            </div>
          }
          onClick={_onePageTempOnClick}
        >
          <Meta title="One Page模版" />
        </Card>
        {}
        <Card
          hoverable
          style={{ width: 160, borderRadius: '8px', marginLeft: 20, marginRight: 20 }}
          cover={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 160,
                height: show ? 160 : 0,
              }}
            >
              <FileTextTwoTone twoToneColor="#eb2f96" style={{ fontSize: '48px' }} />
            </div>
          }
          onClick={_meetingNotesOnClick}
        >
          <Meta title="会议记录模版" />
        </Card>
        {}
      </div>
    </div>
  );
};

export default Templates;
