import React from 'react';
import { Result, Button } from 'antd';

interface Props {
  onReset: () => void;
}

const SuccessResult: React.FC<Props> = ({ onReset }) => (
  <Result
    status="success"
    title="ส่งแบบฟอร์มสำเร็จ!"
    subTitle="ระบบได้รับข้อมูลของคุณเรียบร้อยแล้ว ขอบคุณที่ให้ความสนใจ"
    extra={[
      <Button type="primary" key="new_form" onClick={onReset}>
        กรอกข้อมูลใหม่
      </Button>
    ]}
  />
);

export default SuccessResult;
