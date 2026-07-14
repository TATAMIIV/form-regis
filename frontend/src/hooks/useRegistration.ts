import { useState } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import { type ApplicantData, step1Fields, step2Fields } from '../types/applicant';
import { applicantService } from '../services/api';

export const useRegistration = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ApplicantData>({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  const handleNext = async () => {
    try {
      const fieldsToValidate = currentStep === 0 ? step1Fields : step2Fields;
      await form.validateFields(fieldsToValidate);
      setFormData({ ...formData, ...form.getFieldsValue(true) });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFetchUser = async (idCard: string) => {
    if (idCard.length !== 13) return;
    
    setIsFetchingUser(true);
    try {
      const data = await applicantService.getApplicantByIdCard(idCard);
      
      if (!data) {
        message.info('ไม่พบข้อมูลเก่าในระบบ คุณสามารถกรอกข้อมูลใหม่ได้เลยครับ');
        return;
      }

      const parsedData = { ...data };
      
      if (parsedData.driving_skills && parsedData.driving_skills !== '-' && parsedData.driving_skills !== 'ไม่ระบุ') {
        parsedData.driving_skills = parsedData.driving_skills.split(', ');
      } else {
        parsedData.driving_skills = undefined;
      }
      
      if (parsedData.driving_license && parsedData.driving_license.startsWith('มี')) {
        parsedData.has_driving_license = 'มี';
        const match = parsedData.driving_license.match(/\d+/);
        parsedData.driving_license_years = match ? match[0] : '';
      } else if (parsedData.driving_license === 'ไม่มี') {
        parsedData.has_driving_license = 'ไม่มี';
      }

      const dobFields = ['father_dob', 'mother_dob', 'spouse_dob', 'child1_dob', 'child2_dob'];
      dobFields.forEach(field => {
        if (parsedData[field] && parsedData[field] !== 'ไม่ระบุ') {
          parsedData[field] = dayjs(parsedData[field], 'DD/MM/YYYY');
        } else {
          parsedData[field] = undefined;
        }
      });

      form.setFieldsValue(parsedData);
      message.success('พบข้อมูลในระบบ ทำการดึงข้อมูลสำเร็จ');
    } catch (e) {
      console.error(e);
      message.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsFetchingUser(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalData = { ...formData };

      if (finalData.has_driving_license === 'มี') {
        finalData.driving_license = `มี (${finalData.driving_license_years} ปี)`;
      } else {
        finalData.driving_license = 'ไม่มี';
      }

      if (Array.isArray(finalData.driving_skills)) {
        finalData.driving_skills = finalData.driving_skills.join(', ');
      }

      const familyFields = [
        'father_name_th', 'father_name_en', 'father_dob',
        'mother_name_th', 'mother_name_en', 'mother_dob',
        'spouse_name_th', 'spouse_name_en', 'spouse_dob',
        'child1_name_th', 'child1_name_en', 'child1_dob',
        'child2_name_th', 'child2_name_en', 'child2_dob'
      ];
      familyFields.forEach(field => {
        if (!finalData[field] || (typeof finalData[field] === 'string' && finalData[field].trim() === '')) {
          finalData[field] = 'ไม่ระบุ';
        }
      });

      const dobFields = ['father_dob', 'mother_dob', 'spouse_dob', 'child1_dob', 'child2_dob'];
      dobFields.forEach(field => {
        if (finalData[field] && typeof finalData[field].format === 'function') {
          finalData[field] = finalData[field].format('DD/MM/YYYY');
        }
      });

      await applicantService.saveApplicant(finalData);
      setIsSuccess(true);
    } catch (error: any) {
      message.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCurrentStep(0);
    form.resetFields();
    setFormData({});
  };

  return {
    form,
    currentStep,
    formData,
    loading,
    isSuccess,
    isFetchingUser,
    handleNext,
    handlePrev,
    handleFetchUser,
    handleSubmit,
    handleReset
  };
};
