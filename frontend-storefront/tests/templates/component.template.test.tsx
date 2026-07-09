// ĐÂY LÀ FILE MẪU CHO AI. KHÔNG ĐƯỢC CHỈNH SỬA.
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '../../src/components/ProductCard';

// Giả lập router của Next.js để tránh lỗi "useRouter must be used within a RouterContext"
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: jest.fn(),
    };
  },
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 'prod-123',
    name: 'Mẫu Áo Thun Local Brand',
    price: 250000,
    imageUrl: 'https://via.placeholder.com/150',
    description: 'Sản phẩm cotton 100% thoáng mát',
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    // Kiểm tra tên sản phẩm hiển thị trên giao diện
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();

    // Kiểm tra giá sản phẩm (định dạng giá tiền hiển thị)
    expect(screen.getByText(/250,000/i)).toBeInTheDocument();

    // Kiểm tra hình ảnh sản phẩm có đúng thuộc tính source và alt không
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockProduct.imageUrl);
    expect(image).toHaveAttribute('alt', mockProduct.name);
  });

  it('triggers action when Add to Cart button is clicked', async () => {
    const handleAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    // Tìm kiếm nút Add to Cart thông qua Accessible Role và Name
    const button = screen.getByRole('button', { name: /thêm vào giỏ/i });
    expect(button).toBeInTheDocument();

    // Sử dụng user-event để giả lập hành vi click chân thật từ phía người dùng
    await userEvent.click(button);

    // Xác thực hàm callback đã được gọi chính xác và nhận đúng tham số
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
