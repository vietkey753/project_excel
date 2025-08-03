import React from 'react';
import { Layout as AntLayout, Menu, Typography, Space } from 'antd';
import { FileExcelOutlined, UploadOutlined, CalculatorOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <FileExcelOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Excel Processor
            </Title>
          </Space>
          
          <Menu
            mode="horizontal"
            style={{ border: 'none', background: 'transparent' }}
            items={[
              {
                key: 'upload',
                icon: <UploadOutlined />,
                label: 'Upload',
              },
              {
                key: 'calculate',
                icon: <CalculatorOutlined />,
                label: 'Calculate',
              },
            ]}
          />
        </div>
      </Header>
      
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: 'calc(100vh - 134px)' }}>
          {children}
        </div>
      </Content>
      
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        Excel Processor ©2025 - Phần mềm xử lý file Excel
      </Footer>
    </AntLayout>
  );
};

export default Layout;
