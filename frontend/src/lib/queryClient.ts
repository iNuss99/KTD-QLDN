import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 phút: data mới không refetch lại
      gcTime: 1000 * 60 * 10,     // 10 phút: giữ cache trước khi xóa
      retry: 2,                    // Thử lại 2 lần khi lỗi mạng
      refetchOnWindowFocus: true,  // Tự làm mới khi user quay lại tab
    },
  },
});

export default queryClient;
