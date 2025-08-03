import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Select,
  Alert,
  Table,
  Divider,
  Space,
  message,
  Tag,
  InputNumber
} from 'antd';
import {
  CalculatorOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { excelApi } from '../services/api';
import type { RowCalculationRequest, RowCalculationResult } from '../types';
import { formatNumberWithCommas } from '../utils/numberUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface RowWiseCalculatorProps {
  fileId: number;
  sheetName: string;
  availableColumns: string[];
  sheetData?: Record<string, any>[];
}

const RowWiseCalculator: React.FC<RowWiseCalculatorProps> = ({
  fileId,
  sheetName,
  availableColumns,
  sheetData
}) => {
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide'>('add');
  const [startRow, setStartRow] = useState<number>(11);
  const [endRow, setEndRow] = useState<number | undefined>(undefined);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<RowCalculationResult | null>(null);

  // Auto-detect end row from sheet data
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      // Find the last row with actual data
      let lastRowWithData = 0;
      for (let i = sheetData.length - 1; i >= 0; i--) {
        const row = sheetData[i];
        const hasData = Object.values(row).some(value => 
          value !== null && value !== undefined && value !== ""
        );
        if (hasData) {
          lastRowWithData = i + 1; // Convert to 1-based index
          break;
        }
      }
      setEndRow(lastRowWithData);
    }
  }, [sheetData]);

  const handleCalculate = async () => {
    if (sourceColumns.length === 0) {
      message.error('Vui lòng chọn ít nhất một cột nguồn');
      return;
    }

    if (!targetColumn) {
      message.error('Vui lòng chọn cột đích');
      return;
    }

    if (startRow < 1) {
      message.error('Hàng bắt đầu phải lớn hơn 0');
      return;
    }

    setIsCalculating(true);
    try {
      const request: RowCalculationRequest = {
        file_id: fileId,
        sheet_name: sheetName,
        source_columns: sourceColumns,
        target_column: targetColumn,
        operation,
        start_row: startRow - 1, // Convert to 0-based for backend
        end_row: endRow ? endRow - 1 : undefined
      };

      const calculationResult = await excelApi.calculateRowWise(request);
      setResult(calculationResult);
      message.success(`Tính toán thành công! Đã xử lý ${calculationResult.total_rows} hàng.`);
    } catch (error: any) {
      console.error('Calculation error:', error);
      message.error('Lỗi tính toán: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportToTemplate = async () => {
    if (!result) {
      message.error('Chưa có kết quả tính toán để xuất');
      return;
    }

    try {
      const exportRequest = {
        calculation_result: result,
        template_path: 'templates/FileMauImportThuNhap.xlsx'
      };

      const blob = await excelApi.exportToTemplate(exportRequest);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calculated_template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Xuất file template thành công!');
    } catch (error: any) {
      console.error('Export error:', error);
      message.error('Lỗi xuất file: ' + (error.response?.data?.error || error.message));
    }
  };

  const getOperationText = (op: string) => {
    switch (op) {
      case 'add': return 'Cộng (+)';
      case 'subtract': return 'Trừ (-)';
      case 'multiply': return 'Nhân (×)';
      case 'divide': return 'Chia (÷)';
      default: return 'Tính toán';
    }
  };

  // Table columns for results
  const resultColumns = [
    {
      title: 'Hàng',
      dataIndex: 'row_number',
      key: 'row_number',
      width: 80,
      render: (value: number) => <Tag color="blue">#{value}</Tag>
    },
    ...sourceColumns.map(col => ({
      title: `Cột ${col}`,
      dataIndex: col,
      key: col,
      width: 100,
      render: (value: number) => formatNumberWithCommas(value || 0, 2)
    })),
    {
      title: 'Công thức',
      key: 'formula',
      width: 150,
      render: (_: any, record: any) => {
        const formula = sourceColumns.map(col => formatNumberWithCommas(record[col] || 0, 2)).join(
          operation === 'add' ? ' + ' :
          operation === 'subtract' ? ' - ' :
          operation === 'multiply' ? ' × ' : ' ÷ '
        );
        return <Text code>{formula}</Text>;
      }
    },
    {
      title: `Kết quả (${targetColumn})`,
      dataIndex: 'calculated_value',
      key: 'calculated_value',
      width: 120,
      render: (value: number) => (
        <Tag color="green" style={{ fontWeight: 'bold' }}>
          {formatNumberWithCommas(value || 0, 2)}
        </Tag>
      )
    }
  ];

  return (
    <Card title={
      <Space>
        <CalculatorOutlined />
        <Title level={4} style={{ margin: 0 }}>Tính Toán Theo Hàng (Row-wise)</Title>
      </Space>
    }>
      <Alert
        message="Chế độ tính toán theo hàng"
        description="Tính toán từng hàng một cách riêng biệt (ví dụ: I11 + K11 = L11, I12 + K12 = L12, ...)"
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        {/* Configuration Panel */}
        <Col xs={24} lg={12}>
          <Card title="Cấu hình tính toán" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Source Columns */}
              <div>
                <Text strong>Cột nguồn (Source Columns):</Text>
                <Select
                  mode="multiple"
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn các cột để tính toán (ví dụ: I, K, M)"
                  value={sourceColumns}
                  onChange={setSourceColumns}
                  allowClear
                >
                  {availableColumns.map(col => (
                    <Option key={col} value={col}>Cột {col}</Option>
                  ))}
                </Select>
              </div>

              {/* Operation */}
              <div>
                <Text strong>Phép tính:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={operation}
                  onChange={setOperation}
                >
                  <Option value="add">
                    <Space><PlusOutlined />Cộng (+)</Space>
                  </Option>
                  <Option value="subtract">
                    <Space><MinusOutlined />Trừ (-)</Space>
                  </Option>
                  <Option value="multiply">
                    <Space><CloseOutlined />Nhân (×)</Space>
                  </Option>
                  <Option value="divide">
                    <Space>/</Space>Chia (÷)
                  </Option>
                </Select>
              </div>

              {/* Target Column */}
              <div>
                <Text strong>Cột đích (Target Column):</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn cột để ghi kết quả (ví dụ: L)"
                  value={targetColumn}
                  onChange={setTargetColumn}
                  allowClear
                >
                  {availableColumns.map(col => (
                    <Option key={col} value={col}>Cột {col}</Option>
                  ))}
                </Select>
              </div>

              {/* Row Range */}
              <Row gutter={8}>
                <Col span={12}>
                  <Text strong>Hàng bắt đầu:</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    min={1}
                    value={startRow}
                    onChange={(value) => setStartRow(value || 1)}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>Hàng kết thúc:</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 8 }}
                    min={startRow}
                    value={endRow}
                    onChange={(value) => setEndRow(value || undefined)}
                    placeholder="Tự động"
                  />
                </Col>
              </Row>

              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={handleCalculate}
                loading={isCalculating}
                disabled={sourceColumns.length === 0 || !targetColumn}
                block
                size="large"
              >
                Thực hiện tính toán
              </Button>
              
              {result && (
                <Button
                  type="default"
                  icon={<CheckOutlined />}
                  onClick={handleExportToTemplate}
                  disabled={!result}
                  block
                  style={{ marginTop: 8 }}
                >
                  Xuất vào Template Excel
                </Button>
              )}
            </Space>
          </Card>
        </Col>

        {/* Preview Panel */}
        <Col xs={24} lg={12}>
          <Card title="Xem trước" size="small">
            {sourceColumns.length > 0 && targetColumn && (
              <div>
                <Text strong>Công thức sẽ áp dụng:</Text>
                <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <Text code style={{ fontSize: 16 }}>
                    {sourceColumns.join(
                      operation === 'add' ? ' + ' :
                      operation === 'subtract' ? ' - ' :
                      operation === 'multiply' ? ' × ' : ' ÷ '
                    )} = {targetColumn}
                  </Text>
                </div>
                
                <Divider />
                
                <Text strong>Ví dụ tính toán:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>Hàng {startRow}: {sourceColumns.map(col => `${col}${startRow}`).join(
                    operation === 'add' ? ' + ' :
                    operation === 'subtract' ? ' - ' :
                    operation === 'multiply' ? ' × ' : ' ÷ '
                  )} = {targetColumn}{startRow}</Text>
                </div>
                <div>
                  <Text>Hàng {startRow + 1}: {sourceColumns.map(col => `${col}${startRow + 1}`).join(
                    operation === 'add' ? ' + ' :
                    operation === 'subtract' ? ' - ' :
                    operation === 'multiply' ? ' × ' : ' ÷ '
                  )} = {targetColumn}{startRow + 1}</Text>
                </div>
                <div>
                  <Text type="secondary">...</Text>
                </div>
                
                <Divider />
                
                <Text strong>Phạm vi xử lý:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">Từ hàng {startRow}</Tag>
                  <Tag color="blue">Đến hàng {endRow || 'tự động phát hiện'}</Tag>
                </div>
              </div>
            )}
            
            {(!sourceColumns.length || !targetColumn) && (
              <Alert
                message="Chọn cột để xem trước công thức"
                type="warning"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Results */}
      {result && (
        <>
          <Divider />
          <Card 
            title={
              <Space>
                <CheckOutlined style={{ color: '#52c41a' }} />
                <span>Kết quả tính toán</span>
                <Tag color="green">{result.total_rows} hàng</Tag>
              </Space>
            }
            extra={
              <Space>
                <Tag color="blue">Công thức: {result.formula}</Tag>
                <Tag color="purple">{getOperationText(result.operation)}</Tag>
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>Tóm tắt:</Text>
              <ul style={{ marginTop: 8 }}>
                <li>Cột nguồn: <Tag>{result.source_columns.join(', ')}</Tag></li>
                <li>Cột đích: <Tag color="blue">{result.target_column}</Tag></li>
                <li>Phép tính: <Tag color="purple">{getOperationText(result.operation)}</Tag></li>
                <li>Phạm vi: Hàng {result.start_row} đến hàng {result.end_row}</li>
                <li>Tổng số hàng đã xử lý: <Tag color="green">{result.total_rows}</Tag></li>
              </ul>
            </div>

            <Table
              columns={resultColumns}
              dataSource={result.results}
              rowKey="row_number"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} hàng`,
              }}
              scroll={{ x: 800 }}
              size="small"
            />
          </Card>
        </>
      )}
    </Card>
  );
};

export default RowWiseCalculator;
