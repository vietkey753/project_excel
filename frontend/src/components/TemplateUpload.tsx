import React, { useState, useCallback } from 'react';
import { Card, Typography, Button, Space, Alert, Progress, message, Table, Tag } from 'antd';
import { UploadOutlined, FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { useTemplateUpload, useGetTemplateSheets, useGetTemplateData } from '../hooks/useExcelApi';
import { formatNumberWithCommas } from '../utils/numberUtils';

const { Title, Text } = Typography;

interface TemplateUploadProps {
  onTemplateSelect: (templateId: number, sheetName: string, columns: string[]) => void;
}

const TemplateUpload: React.FC<TemplateUploadProps> = ({ onTemplateSelect }) => {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>('');
  
  const uploadMutation = useTemplateUpload();
  const { data: sheets, isLoading: sheetsLoading } = useGetTemplateSheets(templateId);
  const { data: templateData, isLoading: dataLoading } = useGetTemplateData(templateId, selectedSheet);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        message.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)');
        return;
      }

      // Upload template
      uploadMutation.mutate(file, {
        onSuccess: (response: any) => {
          message.success(`Upload template thành công: ${response.filename}`);
          setTemplateId(response.template_id || response.file_id);
          setTemplateFileName(response.filename);
        },
        onError: (error: any) => {
          message.error(`Upload template thất bại: ${error.message || 'Unknown error'}`);
        }
      });
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
  };

  const handleConfirmTemplate = () => {
    if (templateId && selectedSheet && templateData) {
      const columns = templateData.length > 0 ? Object.keys(templateData[0]) : [];
      onTemplateSelect(templateId, selectedSheet, columns);
      message.success('Đã chọn template thành công!');
    }
  };

  // Create columns for template preview table
  const templateColumns = templateData && templateData.length > 0 
    ? Object.keys(templateData[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        width: 150,
        render: (value: any) => {
          if (typeof value === 'number') {
            return formatNumberWithCommas(value, 2);
          }
          return value?.toString() || '-';
        }
      }))
    : [];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* Template Upload */}
      <Card>
        <Title level={4}>📋 Upload File Template</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          
          {/* Upload Area */}
          <div
            {...getRootProps()}
            style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '6px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? '#f0f9ff' : '#fafafa',
              borderColor: isDragActive ? '#52c41a' : '#d9d9d9'
            }}
          >
            <input {...getInputProps()} />
            <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            
            {isDragActive ? (
              <p style={{ fontSize: '16px', margin: 0 }}>Thả file template vào đây...</p>
            ) : (
              <div>
                <p style={{ fontSize: '16px', margin: '8px 0' }}>
                  Kéo và thả file Excel template vào đây hoặc click để chọn
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Template sẽ được sử dụng để export kết quả tính toán
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div>
              <Progress percent={50} status="active" />
              <p style={{ textAlign: 'center', margin: '8px 0 0 0', color: '#666' }}>
                Đang upload template...
              </p>
            </div>
          )}

          {/* Alternative Upload Button */}
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            disabled={uploadMutation.isPending}
            onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
            block
          >
            {uploadMutation.isPending ? 'Đang upload...' : 'Hoặc chọn template từ máy tính'}
          </Button>
        </Space>
      </Card>

      {/* Template Info */}
      {templateId && templateFileName && (
        <Card>
          <Alert
            message="✅ Template đã upload thành công!"
            description={`File: ${templateFileName} (ID: ${templateId})`}
            type="success"
            showIcon
          />
        </Card>
      )}

      {/* Sheet Selector */}
      {sheets && sheets.length > 0 && (
        <Card>
          <Title level={4}>📋 Chọn Sheet Template</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            
            {sheetsLoading && <Alert message="Đang đọc template..." type="info" />}
            
            <div>
              <p>Tìm thấy {sheets.length} sheet(s) trong template:</p>
              <Space direction="vertical" style={{ width: '100%' }}>
                {sheets.map((sheet) => (
                  <Card 
                    key={sheet.name}
                    size="small" 
                    hoverable
                    onClick={() => handleSheetSelect(sheet.name)}
                    style={{ 
                      cursor: 'pointer',
                      border: selectedSheet === sheet.name ? '2px solid #52c41a' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>📄 {sheet.name}</Text>
                        {sheet.row_count && (
                          <Text style={{ marginLeft: '8px', color: '#666' }}>
                            ({sheet.row_count} hàng)
                          </Text>
                        )}
                        {selectedSheet === sheet.name && (
                          <Tag color="green" style={{ marginLeft: '8px' }}>Đã chọn</Tag>
                        )}
                      </div>
                      <EyeOutlined style={{ color: '#1890ff' }} />
                    </div>
                    
                    {/* Show columns */}
                    {sheet.columns && sheet.columns.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                        Cột: {sheet.columns.slice(0, 8).join(', ')}
                        {sheet.columns.length > 8 && `... (+${sheet.columns.length - 8})`}
                      </div>
                    )}
                  </Card>
                ))}
              </Space>
            </div>
          </Space>
        </Card>
      )}

      {/* Template Preview */}
      {selectedSheet && templateData && (
        <Card>
          <Title level={4}>👁️ Xem trước Template</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            
            {dataLoading && <Alert message="Đang tải dữ liệu template..." type="info" />}
            
            {templateData.length > 0 ? (
              <>
                <Alert
                  message={`Template có ${templateColumns.length} cột và ${templateData.length} hàng dữ liệu`}
                  type="info"
                />
                
                <Table
                  columns={templateColumns}
                  dataSource={templateData.slice(0, 10)} // Show first 10 rows
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  size="small"
                  bordered
                  rowKey={(_, index) => index?.toString() || '0'}
                />
                
                {templateData.length > 10 && (
                  <Text type="secondary">
                    Hiển thị 10/{templateData.length} hàng đầu tiên
                  </Text>
                )}
                
                {/* Confirm Button */}
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleConfirmTemplate}
                  block
                >
                  ✅ Xác nhận sử dụng template này
                </Button>
              </>
            ) : (
              <Alert message="Template không có dữ liệu" type="warning" />
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default TemplateUpload;
