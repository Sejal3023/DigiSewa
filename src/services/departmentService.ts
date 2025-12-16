import { apiService } from './apiService';
import { Department } from '@/types';

const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiService.get('/departments');
    return response.data;
  },

  getDepartmentById: async (id: string): Promise<Department> => {
    const response = await apiService.get(`/departments/${id}`);
    return response.data;
  },
};

export default departmentService;
