# Sử dụng image Node.js phiên bản 22.14.0
FROM node:22.14.0

# Cài đặt Python và pip (dành cho tính năng tối ưu hóa trong server/optimization.ts)
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install pulp

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Mở port 3000 (khớp với server/index.ts)
EXPOSE 3000

# Lệnh khởi động
CMD ["npm", "start"]