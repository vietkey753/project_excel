import React, { useState, useCallback } from 'react';
import { Card, Typography, Button, Space, Alert, Row, Col, Table, Tag, Select, message } from 'antd';
import { UploadOutlined, FileExcelOutlined, LinkOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';

const { Title, Text } = Typography;
const { Option } = Select;

interface TemplateColumn {
  name: string;
  type: 'number' | 'text' | 'date';
  required: boolean;
  description?: string;
}

interface TemplateInfo {
  name: string;
  columns: TemplateColumn[];
  sampleData: Record<string, any>[];
  totalRows: number;
}

interface ColumnMapping {
  templateColumn: string;
  sourceColumn: string;
  confidence: number; // 0-100% matching confidence
}

interface TemplateManagerProps {
  sourceColumns: string[];
  onMappingComplete: (mappings: ColumnMapping[], templateInfo: TemplateInfo) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  sourceColumns,
  onMappingComplete
}) => {
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mock template data (in real app, this would come from uploaded template)
  const mockTemplateInfo: TemplateInfo = {
    name: "Báo cáo tài chính",
    columns: [
      { name: "STT", type: "number", required: true, description: "Số thứ tự" },
      { name: "Tên khoản mục", type: "text", required: true, description: "Tên các khoản mục báo cáo" },
      { name: "Quý 1", type: "number", required: false, description: "Số liệu quý 1" },
      { name: "Quý 2", type: "number", required: false, description: "Số liệu quý 2" },
      { name: "Quý 3", type: "number", required: false, description: "Số liệu quý 3" },
      { name: "Quý 4", type: "number", required: false, description: "Số liệu quý 4" },
      { name: "Tổng năm", type: "number", required: true, description: "Tổng cộng cả năm" },
      { name: "Ghi chú", type: "text", required: false, description: "Ghi chú thêm" }
    ],
    sampleData: [
      { "STT": 1, "Tên khoản mục": "Doanh thu", "Quý 1": 1000, "Quý 2": 1200, "Quý 3": 1100, "Quý 4": 1300, "Tổng năm": 4600, "Ghi chú": "" },
      { "STT": 2, "Tên khoản mục": "Chi phí", "Quý 1": 800, "Quý 2": 900, "Quý 3": 850, "Quý 4": 950, "Tổng năm": 3500, "Ghi chú": "" },
      { "STT": 3, "Tên khoản mục": "Lợi nhuận", "Quý 1": 200, "Quý 2": 300, "Quý 3": 250, "Quý 4": 350, "Tổng năm": 1100, "Ghi chú": "Sau thuế" }
    ],
    totalRows: 3
  };

  const onTemplateDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        message.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)');
        return;
      }

      setIsUploading(true);
      
      // Simulate template upload and analysis
      setTimeout(() => {
        setTemplateInfo(mockTemplateInfo);
        message.success(`Đã tải template: ${file.name}`);
        setIsUploading(false);
        
        // Auto-suggest mappings based on column name similarity
        autoSuggestMappings();
      }, 2000);
    }
  }, []);

  const { getRootProps: getTemplateRootProps, getInputProps: getTemplateInputProps, isDragActive: isTemplateDragActive } = useDropzone({
    onDrop: onTemplateDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const autoSuggestMappings = () => {
    if (!templateInfo) return;

    const suggestions: ColumnMapping[] = [];
    
    templateInfo.columns.forEach(templateCol => {
      // Find best matching source column
      let bestMatch = '';
      let bestScore = 0;

      sourceColumns.forEach(sourceCol => {
        const score = calculateSimilarity(templateCol.name.toLowerCase(), sourceCol.toLowerCase());
        if (score > bestScore) {
          bestScore = score;
          bestMatch = sourceCol;
        }
      });

      if (bestScore > 0.3) { // 30% similarity threshold
        suggestions.push({
          templateColumn: templateCol.name,
          sourceColumn: bestMatch,
          confidence: Math.round(bestScore * 100)
        });
      }
    });

    setColumnMappings(suggestions);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    // Simple string similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const handleMappingChange = (templateColumn: string, sourceColumn: string) => {
    const newMappings = columnMappings.filter(m => m.templateColumn !== templateColumn);
    if (sourceColumn) {
      newMappings.push({
        templateColumn,
        sourceColumn,
        confidence: 100 // Manual mapping = 100% confidence
      });
    }
    setColumnMappings(newMappings);
  };

  const completeMappingProcess = () => {
    if (!templateInfo) {
      message.error('Vui lòng upload template trước');
      return;
    }

    const requiredColumns = templateInfo.columns.filter(col => col.required);
    const mappedRequired = requiredColumns.filter(col => 
      columnMappings.some(mapping => mapping.templateColumn === col.name)
    );

    if (mappedRequired.length < requiredColumns.length) {
      message.warning('Vui lòng map đầy đủ các cột bắt buộc');
      return;
    }

    onMappingComplete(columnMappings, templateInfo);
    message.success('Hoàn thành mapping template!');
  };

  const templateColumns = [
    {
      title: 'Cột Template',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TemplateColumn) => (
        <Space>
          <strong>{name}</strong>
          {record.required && <Tag color="red">Bắt buộc</Tag>}
        </Space>
      )
    },
    {
      title: 'Kiểu dữ liệu',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'number' ? 'green' : type === 'date' ? 'purple' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Map với cột nguồn',
      key: 'mapping',
      render: (record: TemplateColumn) => {
        const currentMapping = columnMappings.find(m => m.templateColumn === record.name);
        return (
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn cột từ file Excel..."
            value={currentMapping?.sourceColumn}
            onChange={(value) => handleMappingChange(record.name, value)}
            allowClear
          >
            {sourceColumns.map(col => (
              <Option key={col} value={col}>{col}</Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: 'Độ tin cậy',
      key: 'confidence',
      render: (record: TemplateColumn) => {
        const mapping = columnMappings.find(m => m.templateColumn === record.name);
        if (!mapping) return '-';
        
        const color = mapping.confidence >= 80 ? 'success' : mapping.confidence >= 50 ? 'warning' : 'error';
        return <Tag color={color}>{mapping.confidence}%</Tag>;
      }
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text type="secondary">{desc || '-'}</Text>
    }
  ];

  return (
    <Card>
      <Title level={4}>📋 Quản Lý Template</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Template Upload */}
        {!templateInfo && (
          <div
            {...getTemplateRootProps()}
            style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '6px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isTemplateDragActive ? '#f0f9ff' : '#fafafa',
              borderColor: isTemplateDragActive ? '#1890ff' : '#d9d9d9'
            }}
          >
            <input {...getTemplateInputProps()} />
            <FileExcelOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            
            {isTemplateDragActive ? (
              <p style={{ fontSize: '16px', margin: 0 }}>Thả file template vào đây...</p>
            ) : (
              <div>
                <p style={{ fontSize: '16px', margin: '8px 0' }}>
                  Kéo và thả file Excel template vào đây
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Template sẽ được sử dụng để format dữ liệu xuất ra
                </p>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  style={{ marginTop: '16px' }}
                  loading={isUploading}
                >
                  {isUploading ? 'Đang upload...' : 'Hoặc chọn file template'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Template Info */}
        {templateInfo && (
          <Alert
            message={`📋 Template: ${templateInfo.name}`}
            description={`${templateInfo.columns.length} cột | ${templateInfo.totalRows} dòng mẫu | ${templateInfo.columns.filter(c => c.required).length} cột bắt buộc`}
            type="info"
            showIcon
            action={
              <Button size="small" onClick={() => setTemplateInfo(null)}>
                Đổi template
              </Button>
            }
          />
        )}

        {/* Column Mapping */}
        {templateInfo && (
          <div>
            <Title level={5}>🔗 Mapping Cột</Title>
            <Table
              dataSource={templateInfo.columns}
              columns={templateColumns}
              rowKey="name"
              size="small"
              pagination={false}
              scroll={{ x: true }}
            />
          </div>
        )}

        {/* Mapping Summary */}
        {templateInfo && columnMappings.length > 0 && (
          <Alert
            message="✅ Tóm tắt Mapping"
            description={
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Text strong>Đã map: </Text>{columnMappings.length}/{templateInfo.columns.length}
                </Col>
                <Col span={6}>
                  <Text strong>Bắt buộc: </Text>
                  {columnMappings.filter(m => templateInfo.columns.find(c => c.name === m.templateColumn)?.required).length}/
                  {templateInfo.columns.filter(c => c.required).length}
                </Col>
                <Col span={12}>
                  <Space>
                    {columnMappings.filter(m => m.confidence >= 80).length > 0 && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        {columnMappings.filter(m => m.confidence >= 80).length} tự động
                      </Tag>
                    )}
                    {columnMappings.filter(m => m.confidence === 100).length > 0 && (
                      <Tag color="blue" icon={<LinkOutlined />}>
                        {columnMappings.filter(m => m.confidence === 100).length} thủ công
                      </Tag>
                    )}
                  </Space>
                </Col>
              </Row>
            }
            type="success"
            showIcon
          />
        )}

        {/* Action Buttons */}
        {templateInfo && (
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={autoSuggestMappings}>
                🔄 Gợi ý mapping tự động
              </Button>
              
              <Button 
                type="primary" 
                size="large"
                onClick={completeMappingProcess}
                disabled={columnMappings.length === 0}
              >
                ✅ Hoàn thành mapping
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default TemplateManager;
