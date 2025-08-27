import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Select,
  Alert,
  Space,
  message,
  Tag,
  InputNumber,
  Input,
  Popconfirm
} from 'antd';
import {
  CalculatorOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { excelApi } from '../services/api';
import type { RowCalculationRequest, RowCalculationResult } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface CalculationColumn {
  id: string;
  name: string;
  sourceColumns: string[];
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'copy';
  targetColumn: string;
}

interface MultiColumnCalculatorProps {
  fileId: number;
  sheetName: string;
  availableColumns: string[];
  sheetData?: Record<string, any>[];
  onCalculationComplete?: (results: RowCalculationResult[]) => void;
}

const MultiColumnCalculator: React.FC<MultiColumnCalculatorProps> = ({
  fileId,
  sheetName,
  availableColumns,
  sheetData,
  onCalculationComplete
}) => {
  const [calculationColumns, setCalculationColumns] = useState<CalculationColumn[]>([]);
  const [startRow, setStartRow] = useState<number>(11);
  const [endRow, setEndRow] = useState<number | undefined>(undefined);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<RowCalculationResult[]>([]);

  // Auto-detect end row from sheet data
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      let lastRowWithData = 0;
      for (let i = sheetData.length - 1; i >= 0; i--) {
        const row = sheetData[i];
        const hasData = Object.values(row).some(value => 
          value !== null && value !== undefined && value !== ""
        );
        if (hasData) {
          lastRowWithData = i + 1;
          break;
        }
      }
      setEndRow(lastRowWithData);
    }
  }, [sheetData]);

  const addCalculationColumn = () => {
    const newColumn: CalculationColumn = {
      id: `calc_${Date.now()}`,
      name: `Tính toán ${calculationColumns.length + 1}`,
      sourceColumns: [],
      operation: 'add',
      targetColumn: ''
    };
    setCalculationColumns([...calculationColumns, newColumn]);
  };

  const removeCalculationColumn = (id: string) => {
    setCalculationColumns(calculationColumns.filter(col => col.id !== id));
  };

  const updateCalculationColumn = (id: string, field: keyof CalculationColumn, value: any) => {
    setCalculationColumns(calculationColumns.map(col => 
      col.id === id ? { ...col, [field]: value } : col
    ));
  };

  const handleCalculateAll = async () => {
    if (calculationColumns.length === 0) {
      message.error('Vui lòng thêm ít nhất một cột tính toán');
      return;
    }

    // Validate each calculation column
    for (const col of calculationColumns) {
      if (col.sourceColumns.length === 0) {
        message.error(`Cột "${col.name}": Vui lòng chọn ít nhất một cột nguồn`);
        return;
      }
      if (!col.targetColumn) {
        message.error(`Cột "${col.name}": Vui lòng chọn cột đích`);
        return;
      }
    }

    if (startRow < 1) {
      message.error('Hàng bắt đầu phải lớn hơn 0');
      return;
    }

    setIsCalculating(true);
    const calculationResults: RowCalculationResult[] = [];

    try {
      // Execute calculations sequentially to avoid conflicts
      for (const col of calculationColumns) {
        const request: RowCalculationRequest = {
          file_id: fileId,
          sheet_name: sheetName,
          source_columns: col.sourceColumns,
          target_column: col.targetColumn,
          operation: col.operation,
          start_row: startRow - 1,
          end_row: endRow ? endRow - 1 : undefined
        };

        const result = await excelApi.calculateRowWise(request);
        calculationResults.push(result);
      }

      setResults(calculationResults);
      message.success(`Hoàn thành tính toán ${calculationColumns.length} cột! Tổng số hàng đã xử lý: ${calculationResults[0]?.total_rows || 0}`);
      
      if (onCalculationComplete) {
        onCalculationComplete(calculationResults);
      }
    } catch (error: any) {
      console.error('Calculation error:', error);
      message.error('Lỗi tính toán: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsCalculating(false);
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

  const getOperationColor = (op: string) => {
    switch (op) {
      case 'add': return 'green';
      case 'subtract': return 'red';
      case 'multiply': return 'blue';
      case 'divide': return 'orange';
      default: return 'default';
    }
  };

  const renderCalculationColumn = (col: CalculationColumn) => (
    <Card
      key={col.id}
      size="small"
      title={
        <Space>
          <CalculatorOutlined />
          <Input
            value={col.name}
            onChange={(e) => updateCalculationColumn(col.id, 'name', e.target.value)}
            style={{ width: 200 }}
            placeholder="Tên cột tính toán"
          />
          <Tag color={getOperationColor(col.operation)}>
            {getOperationText(col.operation)}
          </Tag>
        </Space>
      }
      extra={
        <Popconfirm
          title="Xóa cột tính toán này?"
          onConfirm={() => removeCalculationColumn(col.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Text strong>Cột nguồn:</Text>
          <Select
            mode="multiple"
            placeholder="Chọn các cột để tính toán"
            style={{ width: '100%', marginTop: 8 }}
            value={col.sourceColumns}
            onChange={(value) => updateCalculationColumn(col.id, 'sourceColumns', value)}
          >
            {availableColumns.map(column => (
              <Option key={column} value={column}>{column}</Option>
            ))}
          </Select>
        </Col>
        
        <Col span={6}>
          <Text strong>Phép tính:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={col.operation}
            onChange={(value) => updateCalculationColumn(col.id, 'operation', value)}
          >
            <Option value="add">Cộng (+)</Option>
            <Option value="subtract">Trừ (-)</Option>
            <Option value="multiply">Nhân (×)</Option>
            <Option value="divide">Chia (÷)</Option>
            <Option value="copy">Sao chép text</Option>
          </Select>
        </Col>
        
        <Col span={10}>
          <Text strong>Cột đích:</Text>
          <Select
            placeholder="Chọn cột để ghi kết quả"
            style={{ width: '100%', marginTop: 8 }}
            value={col.targetColumn}
            onChange={(value) => updateCalculationColumn(col.id, 'targetColumn', value)}
          >
            {availableColumns.map(column => (
              <Option key={column} value={column}>{column}</Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <CalculatorOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Tính toán nhiều cột
            </Title>
          </Space>
        }
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addCalculationColumn}
          >
            Thêm cột tính toán
          </Button>
        }
      >
        <Alert
          message="Hướng dẫn sử dụng"
          description="Bạn có thể thêm nhiều cột tính toán cùng lúc. Mỗi cột có thể có phép tính và cột đích riêng biệt."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        {/* Range Settings */}
        <Card size="small" title="Cài đặt phạm vi tính toán" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Hàng bắt đầu:</Text>
              <InputNumber
                min={1}
                value={startRow}
                onChange={(value) => setStartRow(value || 1)}
                style={{ width: '100%', marginTop: 8 }}
              />
            </Col>
            <Col span={8}>
              <Text strong>Hàng kết thúc:</Text>
              <InputNumber
                min={startRow}
                value={endRow}
                onChange={(value) => setEndRow(value || undefined)}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Tự động phát hiện"
              />
            </Col>
            <Col span={8}>
              <Text strong>Số hàng sẽ xử lý:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">
                  {endRow ? endRow - startRow + 1 : 'Tự động'}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Calculation Columns */}
        <div style={{ marginBottom: 16 }}>
          {calculationColumns.map((col) => renderCalculationColumn(col))}
          
          {calculationColumns.length === 0 && (
            <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
              <Text type="secondary">Chưa có cột tính toán nào. Nhấn "Thêm cột tính toán" để bắt đầu.</Text>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<CalculatorOutlined />}
            loading={isCalculating}
            onClick={handleCalculateAll}
            disabled={calculationColumns.length === 0}
          >
            {isCalculating ? 'Đang tính toán...' : `Tính toán ${calculationColumns.length} cột`}
          </Button>
        </Space>

        {/* Results Summary */}
        {results.length > 0 && (
          <Card 
            size="small" 
            title="Kết quả tính toán" 
            style={{ marginTop: 16, background: '#f6ffed' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Số cột đã tính toán:</Text>
                <div><Tag color="green">{results.length}</Tag></div>
              </Col>
              <Col span={8}>
                <Text strong>Số hàng đã xử lý:</Text>
                <div><Tag color="blue">{results[0]?.total_rows || 0}</Tag></div>
              </Col>
              <Col span={8}>
                <Text strong>Trạng thái:</Text>
                <div><Tag color="green" icon={<CheckOutlined />}>Hoàn thành</Tag></div>
              </Col>
            </Row>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default MultiColumnCalculator;
