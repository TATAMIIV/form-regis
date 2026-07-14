export interface ApplicantData {
  [key: string]: any;
}

export const step1Fields = [
  'first_name', 'last_name', 'id_card', 'passport', 'coordinator', 
  'phone', 'position', 'position2', 'exam_date_province', 
  'shirt_size', 'pants_size', 'shoe_size', 'financial_ready', 
  'height', 'weight', 'age', 'has_driving_license', 'driving_license_years', 
  'driving_skills', 'emergency_contact', 'emergency_phone', 'emergency_relation'
];

export const step2Fields = [
  'marital_status', 'father_name_th', 'father_name_en', 'father_dob',
  'mother_name_th', 'mother_name_en', 'mother_dob',
  'spouse_name_th', 'spouse_name_en', 'spouse_dob',
  'child1_name_th', 'child1_name_en', 'child1_dob',
  'child2_name_th', 'child2_name_en', 'child2_dob'
];
