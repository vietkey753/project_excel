import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Alert, Table, Select, Row, Col, Tag, message, InputNumber } from 'antd';
import { MergeCellsOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatNumberWithCommas } from '../utils/numberUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface MultiDataMergerProps {
  calculationResults: any[];
  templateId: number;
  templateSheet: string;
  templateColumns: string[];
  onMergeComplete: (mergedData: any) => void;
}

const MultiDataMerger: React.FC<MultiDataMergerProps> = ({
  calculationResults,
  templateId,
  templateSheet,
  templateColumns,
  onMergeComplete
}) => {
  const [columnMappings, setColumnMappings] = useState<Record<number, string>>({});
  const [startRow, setStartRow] = useState<number>(11);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [mergePreview, setMergePreview] = useState<any[]>([]);

  // Debug startRow changes
  useEffect(() => {
    console.log('startRow state changed to:', startRow);
  }, [startRow]);

  // Initialize mappings with calculation target columns
  useEffect(() => {
    const initialMappings: Record<number, string> = {};
    calculationResults.forEach((result, index) => {
      // Use target_column from calculation as default
      initialMappings[index] = result.target_column || '';
    });
    setColumnMappings(initialMappings);
  }, [calculationResults]);

  // Update mapping for specific calculation result
  const updateMapping = (resultIndex: number, targetColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [resultIndex]: targetColumn
    }));
  };

  // Generate preview of merge for all enabled columns
  const generateMergePreview = () => {
    console.log('=== GENERATE PREVIEW DEBUG ===');
    console.log('Current startRow for preview:', startRow);
    
    const enabledMappings = Object.entries(columnMappings).filter(([_, targetCol]) => targetCol);
    
    if (enabledMappings.length === 0) {
      message.warning('Vui lòng chọn ít nhất một cột đích trong template');
      return;
    }

    const preview: any[] = [];
    
    enabledMappings.forEach(([resultIndex, targetColumn]) => {
      const result = calculationResults[parseInt(resultIndex)];
      if (result && result.results) {
        result.results.slice(0, 3).forEach((row: any, rowIndex: number) => {
          const targetRow = startRow + rowIndex;
          
          // Determine the value to use for preview - same logic as merge
          let valueToUse = row.calculated_value;
          let foundTextValue = false;
          
          console.log(`Preview processing row ${rowIndex}, originalData:`, row);
          
          // First, look in source columns if specified
          if (result.source_columns && result.source_columns.length > 0) {
            const sourceColumns = result.source_columns || [];
            sourceColumns.forEach((col: string) => {
              if (row[col] !== undefined && row[col] !== null && row[col] !== 0 && row[col] !== '') {
                if (typeof row[col] === 'string' && row[col].trim() !== '') {
                  valueToUse = row[col];
                  foundTextValue = true;
                  console.log(`Preview found text in source column ${col}:`, row[col]);
                } else if (typeof row[col] === 'number' && row[col] !== 0) {
                  valueToUse = row[col];
                  console.log(`Preview found number in source column ${col}:`, row[col]);
                }
              }
            });
          }
          
          // If no source columns or no data found, search all fields
          if (!foundTextValue && (typeof valueToUse === 'number' && valueToUse === 0)) {
            Object.keys(row).forEach(key => {
              if (key !== 'row_number' && key !== 'calculated_value' && row[key] !== undefined && row[key] !== null) {
                if (typeof row[key] === 'string' && row[key].trim() !== '') {
                  valueToUse = row[key];
                  foundTextValue = true;
                  console.log(`Preview found text in field ${key}:`, row[key]);
                } else if (typeof row[key] === 'number' && row[key] !== 0) {
                  valueToUse = row[key];
                  console.log(`Preview found number in field ${key}:`, row[key]);
                }
              }
            });
          }
          
          console.log(`Preview: ${targetColumn}${targetRow} = ${valueToUse} (type: ${typeof valueToUse})`);
          
          preview.push({
            id: `${resultIndex}-${rowIndex}`,
            calculationName: `Tính toán ${parseInt(resultIndex) + 1}`,
            sourceRow: row.row_number,
            targetRow: targetRow,
            targetColumn,
            calculatedValue: valueToUse,
            operation: result.operation,
            sourceColumns: result.source_columns.join(' + '),
            action: `Insert "${valueToUse}" into ${targetColumn}${targetRow}`
          });
        });
      }
    });

    console.log('Preview data:', preview);
    console.log('=== END GENERATE PREVIEW DEBUG ===');

    setMergePreview(preview);
    setIsPreviewMode(true);
  };

  const handleMerge = () => {
    console.log('=== HANDLE MERGE DEBUG ===');
    console.log('Current startRow state:', startRow);
    console.log('calculationResults:', calculationResults);
    
    const enabledMappings = Object.entries(columnMappings).filter(([_, targetCol]) => targetCol);
    
    if (enabledMappings.length === 0) {
      message.error('Vui lòng chọn ít nhất một cột đích trong template');
      return;
    }

    // Prepare merge data for all selected columns
    const allMergeData = enabledMappings.map(([resultIndexStr, targetColumn]) => {
      const resultIndex = parseInt(resultIndexStr);
      const result = calculationResults[resultIndex];
      
      console.log(`Processing column ${targetColumn}, using startRow: ${startRow}`);
      console.log('Result data structure:', result);
      
      const columnData = {
        resultIndex,
        templateId,
        templateSheet,
        targetColumn,
        startRow,
        calculatedData: result.results.map((row: any, rowIndex: number) => {
          const targetRow = startRow + rowIndex;
          
          // Determine the value to use - check for text first, then calculated_value
          let valueToUse = row.calculated_value;
          let foundTextValue = false;
          
          console.log(`Processing row ${rowIndex}, originalData:`, row);
          
          // First, look in source columns if specified
          if (result.source_columns && result.source_columns.length > 0) {
            const sourceColumns = result.source_columns || [];
            sourceColumns.forEach((col: string) => {
              if (row[col] !== undefined && row[col] !== null && row[col] !== 0 && row[col] !== '') {
                if (typeof row[col] === 'string' && row[col].trim() !== '') {
                  valueToUse = row[col];
                  foundTextValue = true;
                  console.log(`Found text in source column ${col}:`, row[col]);
                } else if (typeof row[col] === 'number' && row[col] !== 0) {
                  valueToUse = row[col];
                  console.log(`Found number in source column ${col}:`, row[col]);
                }
              }
            });
          }
          
          // If no source columns or no data found, search all fields
          if (!foundTextValue && (typeof valueToUse === 'number' && valueToUse === 0)) {
            Object.keys(row).forEach(key => {
              if (key !== 'row_number' && key !== 'calculated_value' && row[key] !== undefined && row[key] !== null) {
                if (typeof row[key] === 'string' && row[key].trim() !== '') {
                  valueToUse = row[key];
                  foundTextValue = true;
                  console.log(`Found text in field ${key}:`, row[key]);
                } else if (typeof row[key] === 'number' && row[key] !== 0) {
                  valueToUse = row[key];
                  console.log(`Found number in field ${key}:`, row[key]);
                }
              }
            });
          }
          
          console.log(`  Row ${rowIndex}: sourceRow=${row.row_number}, targetRow=${targetRow}, value=${valueToUse} (type: ${typeof valueToUse})`);
          
          return {
            sourceRow: row.row_number,
            targetRow: targetRow,
            value: valueToUse,
            originalData: row
          };
        }),
        summary: {
          totalRows: result.results.length,
          operation: result.operation,
          sourceColumns: result.source_columns,
          targetColumn
        }
      };
      
      return columnData;
    });

    // Send proper structure for multi-column merge
    const mergePayload = {
      templateId,
      templateSheet,
      startRow,
      mergeData: allMergeData  // Send all columns for multi-column support
    };

    console.log('Final merge payload:', JSON.stringify(mergePayload, null, 2));
    console.log('=== END HANDLE MERGE DEBUG ===');

    onMergeComplete(mergePayload);
    message.success(`Đã chèn ${enabledMappings.length} cột tính toán vào template!`);
  };

  // Table columns for preview
  const previewColumns = [
    {
      title: 'Tính toán',
      dataIndex: 'calculationName',
      key: 'calculationName',
      width: 120,
      render: (name: string) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'Hàng nguồn',
      dataIndex: 'sourceRow',
      key: 'sourceRow',
      width: 100,
      render: (row: number) => <Tag color="gray">Row {row}</Tag>
    },
    {
      title: 'Hàng đích',
      dataIndex: 'targetRow',
      key: 'targetRow',
      width: 100,
      render: (row: number, record: any) => <Tag color="green">{record.targetColumn}{row}</Tag>
    },
    {
      title: 'Phép tính',
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: (op: string) => <Tag color="orange">{op.toUpperCase()}</Tag>
    },
    {
      title: 'Kết quả',
      dataIndex: 'calculatedValue',
      key: 'calculatedValue',
      width: 120,
      render: (value: any) => (
        <Tag color="red" style={{ fontWeight: 'bold' }}>
          {typeof value === 'number' ? formatNumberWithCommas(value, 2) : String(value)}
        </Tag>
      )
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Text type="secondary" style={{ fontSize: '10px' }}>{action}</Text>
    }
  ];

  const enabledCount = Object.values(columnMappings).filter(col => col).length;
  const totalCalculations = calculationResults.length;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* Header Info */}
      <Card>
        <Title level={4}>
          <MergeCellsOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
          Chèn Nhiều Cột vào Template
        </Title>
        
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Alert
              message="📊 Kết quả tính toán"
              description={`${totalCalculations} cột đã tính toán, ${enabledCount} cột sẽ chèn`}
              type="info"
            />
          </Col>
          <Col span={8}>
            <Alert
              message="📋 Template đích"
              description={`${templateSheet} (${templateColumns.length} cột available)`}
              type="success"
            />
          </Col>
          <Col span={8}>
            <Alert
              message="🎯 Cài đặt"
              description={`Chèn từ hàng ${startRow}`}
              type="warning"
            />
          </Col>
        </Row>
      </Card>

      {/* Column Mappings */}
      <Card size="small" title="🔗 Mapping Cột Tính Toán → Template">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Text strong>Hàng bắt đầu chèn: (hiện tại: {startRow})</Text>
            <InputNumber
              min={1}
              max={100}
              value={startRow}
              onChange={(value) => {
                console.log('InputNumber onChange triggered:', value);
                const newStartRow = value !== null && value !== undefined ? value : 1;
                console.log('Setting startRow to:', newStartRow);
                setStartRow(newStartRow);
                // Force preview to refresh
                setIsPreviewMode(false);
              }}
              onBlur={(e) => {
                const inputValue = parseInt(e.target.value) || 1;
                console.log('InputNumber onBlur:', inputValue);
                setStartRow(inputValue);
              }}
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Nhập số hàng (1-100)"
            />
          </Col>
          <Col span={8}>
            <Text strong>Test nhanh:</Text>
            <div style={{ marginTop: 8 }}>
              <Space>
                <Button size="small" onClick={() => setStartRow(2)}>Hàng 2</Button>
                <Button size="small" onClick={() => setStartRow(5)}>Hàng 5</Button>
                <Button size="small" onClick={() => setStartRow(10)}>Hàng 10</Button>
              </Space>
            </div>
          </Col>
        </Row>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {calculationResults.map((result, index) => (
            <Card key={index} size="small" style={{ background: '#fafafa' }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Tag color="blue">Tính toán {index + 1}</Tag>
                  <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                    {result.operation}: {result.source_columns.join(' + ')} 
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    → Gốc: {result.target_column}
                  </div>
                </Col>
                
                <Col span={8}>
                  <Text strong>Chèn vào cột template:</Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={columnMappings[index]}
                    onChange={(value) => updateMapping(index, value)}
                    placeholder="Chọn cột đích..."
                    allowClear
                  >
                    {templateColumns.map(column => (
                      <Option key={column} value={column}>{column}</Option>
                    ))}
                  </Select>
                </Col>
                
                <Col span={6}>
                  <Text strong>Số hàng:</Text>
                  <div><Tag color="green">{result.results?.length || 0} hàng</Tag></div>
                </Col>
                
                <Col span={4}>
                  <Text strong>Trạng thái:</Text>
                  <div>
                    {columnMappings[index] ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Enable</Tag>
                    ) : (
                      <Tag color="default">Skip</Tag>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>

      {/* Action Buttons */}
      <Row gutter={16}>
        <Col span={12}>
          <Button
            type="default"
            size="large"
            icon={<EyeOutlined />}
            onClick={generateMergePreview}
            disabled={enabledCount === 0}
            style={{ width: '100%' }}
          >
            Preview ({enabledCount} cột)
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            size="large"
            icon={<MergeCellsOutlined />}
            onClick={handleMerge}
            disabled={enabledCount === 0}
            style={{ width: '100%' }}
          >
            Merge {enabledCount} cột vào Template
          </Button>
        </Col>
      </Row>

      {/* Preview Results */}
      {isPreviewMode && mergePreview.length > 0 && (
        <Card size="small" title="👁️ Preview Merge" style={{ background: '#f0f9ff' }}>
          <Alert
            message={`Sẽ chèn ${enabledCount} cột tính toán vào template bắt đầu từ hàng ${startRow}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Table
            dataSource={mergePreview}
            columns={previewColumns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: true }}
          />
          
          {mergePreview.length < enabledCount * 3 && (
            <Alert
              message={`Hiển thị preview. Sẽ merge tất cả dữ liệu khi thực hiện.`}
              type="warning"
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {/* Summary */}
      {enabledCount > 0 && (
        <Card size="small" title="📋 Tóm tắt merge" style={{ background: '#f6ffed' }}>
          <Text strong>Tổng quan:</Text>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li><strong>📥 Input:</strong> {enabledCount} cột tính toán đã chọn</li>
            <li><strong>📤 Output:</strong> Chèn vào template <code>{templateSheet}</code></li>
            <li><strong>🎯 Vị trí:</strong> Từ hàng {startRow}</li>
          </ul>
        </Card>
      )}
    </Space>
  );
};

export default MultiDataMerger;
