import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Table, Tag, Space, Alert, Row, Col, Button, Select, Divider } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, NumberOutlined, FontColorsOutlined, CalendarOutlined } from '@ant-design/icons';
import MultiColumnCalculator from './MultiColumnCalculator';

const { Title, Text } = Typography;
const { Option } = Select;

interface DataAnalysis {
  column: string;
  type: 'number' | 'text' | 'date' | 'mixed';
  headerRow: number;
  dataStartRow: number;
  sampleValues: any[];
  numericCount: number;
  textCount: number;
  totalRows: number;
}

interface SmartDataAnalyzerProps {
  fileId: number;
  sheetName: string;
  sheetData: Record<string, any>[];
  onAnalysisComplete: (analysis: DataAnalysis[]) => void;
  onCalculationComplete?: (results: any[]) => void;
}

const SmartDataAnalyzer: React.FC<SmartDataAnalyzerProps> = ({
  fileId,
  sheetName,
  sheetData,
  onAnalysisComplete,
  onCalculationComplete
}) => {
  const [analysis, setAnalysis] = useState<DataAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDataStartRow, setSelectedDataStartRow] = useState<number>(1);

  // Reset state when component mounts or when new sheet data is loaded
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      console.log('New sheet data loaded, resetting to default row 2 (index 1)');
      setSelectedDataStartRow(1);
      setAnalysis([]);
    }
  }, [fileId, sheetName]);

  // Analyze data structure with useCallback to prevent unnecessary re-renders
  const analyzeData = useCallback(() => {
    if (!sheetData || sheetData.length === 0) return;

    setIsAnalyzing(true);
    console.log('Analyzing data with selectedDataStartRow:', selectedDataStartRow);
    console.log('Total sheet data rows:', sheetData.length);

    try {
      const columns = Object.keys(sheetData[0]);
      const analysisResults: DataAnalysis[] = [];

      columns.forEach(column => {
        const values = sheetData.map(row => row[column]);
        let numericCount = 0;
        let textCount = 0;
        let dataStartRow = selectedDataStartRow;

        // Count data types from selected start row
        const dataValues = values.slice(selectedDataStartRow);
        console.log(`Column ${column}: analyzing from row ${selectedDataStartRow + 1}, total values:`, dataValues.length);
        
        dataValues.forEach(value => {
          if (value !== null && value !== undefined && value !== '') {
            const numValue = parseFloat(String(value));
            if (!isNaN(numValue) && isFinite(numValue)) {
              numericCount++;
            } else {
              textCount++;
            }
          }
        });

        // Determine column type
        let type: 'number' | 'text' | 'date' | 'mixed' = 'text';
        if (numericCount > textCount * 2) {
          type = 'number';
        } else if (textCount > numericCount * 2) {
          type = 'text';
        } else if (numericCount > 0 && textCount > 0) {
          type = 'mixed';
        }

        // Check for date patterns
        const datePatterns = [/\d{1,2}\/\d{1,2}\/\d{4}/, /\d{4}-\d{2}-\d{2}/];
        const hasDatePattern = values.some(value => 
          datePatterns.some(pattern => pattern.test(String(value)))
        );
        if (hasDatePattern) {
          type = 'date';
        }

        console.log(`Column ${column}: type=${type}, numeric=${numericCount}, text=${textCount}`);

        analysisResults.push({
          column,
          type,
          headerRow: 0, // Assume first row is header
          dataStartRow,
          sampleValues: values.slice(0, 5),
          numericCount,
          textCount,
          totalRows: values.length
        });
      });

      setAnalysis(analysisResults);
      onAnalysisComplete(analysisResults);
      console.log('Analysis completed:', analysisResults);
    } catch (error) {
      console.error('Error during analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sheetData, selectedDataStartRow, onAnalysisComplete]);

  // Use useEffect with debouncing to prevent excessive re-renders
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeData();
      }, 100); // Small delay to prevent rapid re-renders

      return () => clearTimeout(timeoutId);
    }
  }, [sheetData, selectedDataStartRow, analyzeData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <NumberOutlined style={{ color: '#52c41a' }} />;
      case 'text': return <FontColorsOutlined style={{ color: '#1890ff' }} />;
      case 'date': return <CalendarOutlined style={{ color: '#722ed1' }} />;
      case 'mixed': return <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />;
      default: return <FontColorsOutlined />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'success';
      case 'text': return 'blue';
      case 'date': return 'purple';
      case 'mixed': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Cột',
      dataIndex: 'column',
      key: 'column',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Kiểu dữ liệu',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
        </Space>
      )
    },
    {
      title: 'Dữ liệu số',
      dataIndex: 'numericCount',
      key: 'numericCount',
      render: (count: number, record: DataAnalysis) => (
        <Text>{count}/{record.totalRows - record.dataStartRow}</Text>
      )
    },
    {
      title: 'Dữ liệu chữ',
      dataIndex: 'textCount',
      key: 'textCount',
      render: (count: number, record: DataAnalysis) => (
        <Text>{count}/{record.totalRows - record.dataStartRow}</Text>
      )
    },
    {
      title: 'Mẫu dữ liệu',
      dataIndex: 'sampleValues',
      key: 'sampleValues',
      render: (values: any[]) => (
        <div style={{ maxWidth: '200px' }}>
          {values.slice(0, 3).map((value, index) => (
            <div key={index} style={{ 
              fontSize: '11px', 
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Hàng {index + 1}: {String(value || '(trống)')}
            </div>
          ))}
        </div>
      )
    }
  ];

  // Memoize the row options to prevent re-creation on every render
  const rowOptions = useMemo(() => {
    const maxRows = Math.min(30, sheetData?.length || 0);
    return Array.from({ length: maxRows }, (_, i) => ({
      key: i,
      value: i,
      label: `Hàng ${i + 1} ${i === 0 ? '(Header)' : i === 1 ? '(Mặc định - Dữ liệu)' : ''}`
    }));
  }, [sheetData?.length]);

  // Memoize numeric columns to prevent recalculation
  const numericColumns = useMemo(() => 
    analysis.filter(col => 
      col.type === 'number' || (col.type === 'mixed' && col.numericCount > col.textCount)
    ), [analysis]);

  return (
    <Card>
      <Title level={4}>🔍 Phân Tích Dữ Liệu Thông Minh</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Configuration */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                📊 Hàng bắt đầu dữ liệu số:
              </label>
              <Select
                style={{ width: '100%' }}
                value={selectedDataStartRow}
                onChange={(value) => {
                  console.log('Changing selectedDataStartRow to:', value);
                  setSelectedDataStartRow(value);
                }}
                placeholder="Chọn hàng bắt đầu..."
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label || '';
                  return label.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
              >
                {rowOptions.map(option => (
                  <Option key={option.key} value={option.value} label={option.label}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ paddingTop: '28px' }}>
              <Space>
                <Button 
                  type="primary" 
                  onClick={analyzeData}
                  loading={isAnalyzing}
                >
                  {isAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Current state:');
                    console.log('selectedDataStartRow:', selectedDataStartRow);
                    console.log('sheetData length:', sheetData?.length || 0);
                    console.log('analysis length:', analysis.length);
                  }}
                >
                  Debug Info
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Summary */}
        {analysis.length > 0 && (
          <Alert
            message="📋 Tóm tắt phân tích"
            description={
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Text strong>Tổng cột: </Text>{analysis.length}
                </Col>
                <Col span={6}>
                  <Text strong>Cột số: </Text>{numericColumns.length}
                </Col>
                <Col span={6}>
                  <Text strong>Tổng dòng: </Text>{sheetData?.length || 0}
                </Col>
                <Col span={6}>
                  <Text strong>Dòng dữ liệu: </Text>{(sheetData?.length || 0) - selectedDataStartRow}
                </Col>
              </Row>
            }
            type="info"
            showIcon
          />
        )}

        {/* Analysis Results Table */}
        {analysis.length > 0 && (
          <div>
            <Title level={5}>📊 Chi tiết phân tích từng cột:</Title>
            <Table
              dataSource={analysis}
              columns={columns}
              rowKey="column"
              size="small"
              pagination={false}
              scroll={{ x: true }}
            />
          </div>
        )}

        {/* Recommendations */}
        {numericColumns.length > 0 && (
          <Alert
            message="💡 Gợi ý tính toán"
            description={
              <div>
                <p>Các cột phù hợp cho tính toán:</p>
                <Space wrap>
                  {numericColumns.map(col => (
                    <Tag key={col.column} color="success" icon={<CheckCircleOutlined />}>
                      {col.column} ({col.numericCount} số)
                    </Tag>
                  ))}
                </Space>
              </div>
            }
            type="success"
            showIcon
          />
        )}

        {numericColumns.length === 0 && analysis.length > 0 && (
          <Alert
            message="⚠️ Không tìm thấy cột số"
            description="Không có cột nào chứa đủ dữ liệu số để tính toán. Vui lòng kiểm tra lại hàng bắt đầu dữ liệu."
            type="warning"
            showIcon
          />
        )}
      </Space>

      {/* Multi-Column Calculator */}
      {analysis.length > 0 && (
        <>
          <Divider />
          <MultiColumnCalculator
            fileId={fileId}
            sheetName={sheetName}
            availableColumns={analysis.map(a => a.column)}
            sheetData={sheetData}
            onCalculationComplete={(results) => {
              console.log('Calculation completed:', results);
              // Pass results to parent component
              if (onCalculationComplete) {
                onCalculationComplete(results);
              }
            }}
          />
        </>
      )}
    </Card>
  );
};

export default SmartDataAnalyzer;
