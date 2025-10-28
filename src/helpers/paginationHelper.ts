import { IPaginationOptions } from '../types/pagination';

const calculatePagination = (options: IPaginationOptions) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const count = Number(options.count || 0);

  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    count,
  };
};

export const paginationHelper = {
  calculatePagination,
};
