import React, { useState, useCallback } from 'react';
import { Card, Typography, Button, Space, Alert, Progress, message, Select, Row, Col } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InboxOutlined, UploadOutlined, EnvironmentOutlined, BankOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { useHealthCheck, useFileUpload, useGetSheets, useGetSheetData, useGetProvinces, useGetUnits } from '../hooks/useExcelApi';
import SmartDataAnalyzer from './SmartDataAnalyzer';
import TemplateManager from './TemplateManager';

const { Title, Text } = Typography;
const { Option } = Select;

const FileUpload: React.FC<{ onUploadSuccess: (fileId: number) => void }> = ({ onUploadSuccess }) => {
  const { data: healthData, isLoading, error } = useHealthCheck();
  const uploadMutation = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        message.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)');
        return;
      }

      // Upload file
      uploadMutation.mutate(file, {
        onSuccess: (response) => {
          message.success(`Upload thành công: ${response.filename}`);
          onUploadSuccess(response.file_id);
        },
        onError: (error: any) => {
          message.error(`Upload thất bại: ${error.message || 'Unknown error'}`);
        }
      });
    }
  }, [uploadMutation, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });
  
  return (
    <Card>
      <Title level={4}>📁 Upload Excel File</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* API Connection Status */}
        {isLoading && <Alert message="Đang kiểm tra kết nối..." type="info" />}
        {error && (
          <Alert 
            message="Lỗi kết nối Backend" 
            description="Không thể kết nối tới server. Vui lòng kiểm tra backend đang chạy tại port 8080."
            type="error" 
            icon={<ExclamationCircleOutlined />}
          />
        )}
        {healthData && (
          <Alert 
            message="✅ Kết nối Backend thành công!" 
            description="API server đang hoạt động bình thường."
            type="success" 
            icon={<CheckCircleOutlined />}
          />
        )}
        
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '6px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f0f9ff' : '#fafafa',
            borderColor: isDragActive ? '#1890ff' : '#d9d9d9'
          }}
        >
          <input {...getInputProps()} />
          <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          
          {isDragActive ? (
            <p style={{ fontSize: '16px', margin: 0 }}>Thả file Excel vào đây...</p>
          ) : (
            <div>
              <p style={{ fontSize: '16px', margin: '8px 0' }}>
                Kéo và thả file Excel vào đây hoặc click để chọn file
              </p>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                Hỗ trợ: .xlsx, .xls (tối đa 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div>
            <Progress percent={50} status="active" />
            <p style={{ textAlign: 'center', margin: '8px 0 0 0', color: '#666' }}>
              Đang upload file...
            </p>
          </div>
        )}

        {/* Alternative Upload Button */}
        <Button 
          type="primary" 
          icon={<UploadOutlined />}
          disabled={!healthData || uploadMutation.isPending}
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          block
        >
          {uploadMutation.isPending ? 'Đang upload...' : 'Hoặc chọn file từ máy tính'}
        </Button>
      </Space>
    </Card>
  );
};

const ProvinceUnitSelector: React.FC<{ onSelect: (provinceId: number, unitId: number) => void }> = ({ onSelect }) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  
  const { data: provinces, isLoading: provincesLoading, error: provincesError } = useGetProvinces();
  const { data: units, isLoading: unitsLoading, error: unitsError } = useGetUnits(selectedProvinceId);
  
  const handleProvinceChange = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedUnitId(null); // Reset unit when province changes
  };
  
  const handleUnitChange = (unitId: number) => {
    setSelectedUnitId(unitId);
    if (selectedProvinceId) {
      onSelect(selectedProvinceId, unitId);
    }
  };
  
  const selectedProvince = provinces?.find(p => p.id === selectedProvinceId);
  const selectedUnit = units?.find(u => u.id === selectedUnitId);
  
  return (
    <Card>
      <Title level={4}>🏛️ Chọn Tỉnh/Thành phố và Đơn vị</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                <EnvironmentOutlined /> Tỉnh/Thành phố:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn tỉnh/thành phố..."
                loading={provincesLoading}
                value={selectedProvinceId}
                onChange={handleProvinceChange}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {provinces?.map(province => (
                  <Option key={province.id} value={province.id}>
                    {province.name} ({province.code})
                  </Option>
                ))}
              </Select>
              
              {provincesError && (
                <Alert 
                  message="Lỗi tải danh sách tỉnh/thành phố" 
                  type="error" 
                  style={{ marginTop: '8px', fontSize: '12px' }}
                />
              )}
            </div>
          </Col>
          
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                <BankOutlined /> Đơn vị:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder={selectedProvinceId ? "Chọn đơn vị..." : "Vui lòng chọn tỉnh/thành phố trước"}
                loading={unitsLoading}
                value={selectedUnitId}
                onChange={handleUnitChange}
                disabled={!selectedProvinceId}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {units?.map(unit => (
                  <Option key={unit.id} value={unit.id}>
                    {unit.name}
                  </Option>
                ))}
              </Select>
              
              {unitsError && (
                <Alert 
                  message="Lỗi tải danh sách đơn vị" 
                  type="error" 
                  style={{ marginTop: '8px', fontSize: '12px' }}
                />
              )}
            </div>
          </Col>
        </Row>
        
        {/* Selection Summary */}
        {selectedProvince && selectedUnit && (
          <Alert
            message="✅ Đã chọn thành công!"
            description={
              <div>
                <p style={{ margin: 0 }}>
                  <strong>Tỉnh/TP:</strong> {selectedProvince.name} ({selectedProvince.code})
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Đơn vị:</strong> {selectedUnit.name}
                </p>
              </div>
            }
            type="success"
            showIcon
          />
        )}
        
        {/* Help text */}
        {!selectedProvinceId && (
          <Alert
            message="Hướng dẫn"
            description="Vui lòng chọn tỉnh/thành phố trước, sau đó chọn đơn vị tương ứng."
            type="info"
            showIcon
          />
        )}
        
        {selectedProvinceId && !selectedUnitId && units && units.length === 0 && (
          <Alert
            message="Không có đơn vị"
            description={`Tỉnh/thành phố ${selectedProvince?.name} chưa có đơn vị nào trong hệ thống.`}
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

const SheetSelector: React.FC<{ fileId: number; onSheetSelect: (sheetName: string) => void }> = ({ fileId, onSheetSelect }) => {
  const { data: sheets, isLoading, error } = useGetSheets(fileId);
  
  return (
    <Card>
      <Title level={4}>📋 Chọn Sheet Excel</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {isLoading && <Alert message="Đang đọc file Excel..." type="info" />}
        
        {error && (
          <Alert 
            message="Lỗi đọc file Excel" 
            description="Không thể đọc được sheets trong file Excel."
            type="error" 
          />
        )}
        
        {sheets && sheets.length > 0 ? (
          <div>
            <p>Tìm thấy {sheets.length} sheet(s) trong file:</p>
            <Space direction="vertical" style={{ width: '100%' }}>
              {sheets.map((sheet) => (
                <Card 
                  key={sheet.name}
                  size="small" 
                  hoverable
                  onClick={() => onSheetSelect(sheet.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>📊 {sheet.name}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {sheet.columns?.length || 0} cột • {sheet.row_count} dòng
                      </div>
                    </div>
                    <Button type="primary" size="small">
                      Chọn
                    </Button>
                  </div>
                  
                  {/* Show first few columns */}
                  {sheet.columns && sheet.columns.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                      Cột: {sheet.columns.slice(0, 5).join(', ')}
                      {sheet.columns.length > 5 && '...'}
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          </div>
        ) : sheets && sheets.length === 0 ? (
          <Alert message="Không tìm thấy sheet nào trong file" type="warning" />
        ) : null}
      </Space>
    </Card>
  );
};

const ColumnCalculator: React.FC<{ 
  fileId: number; 
  sheetName: string; 
  onCalculationComplete: (result: any) => void 
}> = ({ fileId, sheetName, onCalculationComplete }) => {
  const [startRow, setStartRow] = useState<number | null>(null); // Starting row position
  const [sourceColumns, setSourceColumns] = useState<string[]>([]); // Columns to calculate from
  const [targetColumn, setTargetColumn] = useState<string>(''); // Target column in template
  const [calculationType, setCalculationType] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [showSmartAnalysis, setShowSmartAnalysis] = useState(true);
  const [dataRange, setDataRange] = useState<any[]>([]); // Data from start position downward

  // Get sheet data to show available columns
  const { data: sheetData, isLoading: dataLoading, error: dataError } = useGetSheetData(fileId, sheetName);
  
  // Available calculation types for row-wise operations
  const calculationTypes = [
    { value: 'add', label: 'Cộng các cột trong hàng', icon: '➕' },
    { value: 'subtract', label: 'Trừ các cột trong hàng', icon: '➖' },
    { value: 'multiply', label: 'Nhân các cột trong hàng', icon: '✖️' },
    { value: 'divide', label: 'Chia các cột trong hàng', icon: '➗' },
    { value: 'extract_range', label: 'Lấy dữ liệu từ vùng', icon: '📤' }
  ];

  // Get available columns from data - Show ALL columns, not just numeric ones
  const availableColumns = sheetData && sheetData.length > 0 
    ? Object.keys(sheetData[0])
    : [];

  // Function to get data range from start position downward
  const getDataRange = (startRowIndex: number, columns: string[] = []) => {
    if (!sheetData || startRowIndex >= sheetData.length) return [];
    
    const range = [];
    for (let i = startRowIndex; i < sheetData.length; i++) {
      const row = sheetData[i];
      
      // If no specific columns provided, use columns from the selected row
      // If specific columns provided, only check those columns
      const columnsToCheck = columns.length > 0 ? columns : Object.keys(sheetData[startRowIndex] || {});
      const hasData = columnsToCheck.some(col => {
        const value = row[col];
        return value !== null && value !== undefined && value !== '';
      });
      
      if (!hasData) break; // Stop when no data found in any checked column
      
      range.push({
        rowIndex: i,
        rowNumber: i + 1,
        data: row
      });
    }
    return range;
  };

  const handleCalculate = async () => {
    if (!startRow || !sourceColumns.length || !calculationType) {
      message.warning('Vui lòng chọn vị trí bắt đầu, cột nguồn và loại tính toán');
      return;
    }

    setIsCalculating(true);
    
    try {
      const range = getDataRange(startRow, sourceColumns);
      
      if (range.length === 0) {
        message.warning('Không tìm thấy dữ liệu từ vị trí được chọn');
        return;
      }

      // Perform row-wise calculation
      const calculatedRows = range.map(row => {
        const values = sourceColumns.map(col => {
          const val = row.data[col];
          return parseFloat(String(val)) || 0;
        });

        let result = 0;
        switch (calculationType) {
          case 'add':
            result = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'subtract':
            result = values.reduce((diff, val, index) => index === 0 ? val : diff - val);
            break;
          case 'multiply':
            result = values.reduce((prod, val) => prod * val, 1);
            break;
          case 'divide':
            result = values.reduce((quot, val, index) => index === 0 ? val : quot / val);
            break;
          case 'extract_range':
            result = values[0]; // Just take first column for extraction
            break;
          default:
            result = 0;
        }

        return {
          ...row,
          calculatedValue: result,
          sourceValues: values,
          formula: `${sourceColumns.join(` ${calculationType === 'add' ? '+' : calculationType === 'subtract' ? '-' : calculationType === 'multiply' ? '*' : '/'} `)}`
        };
      });

      const calculationData = {
        type: calculationType,
        startPosition: { row: startRow + 1, columns: sourceColumns },
        targetColumn,
        calculatedRows,
        summary: {
          totalRows: calculatedRows.length,
          total: calculatedRows.reduce((sum, row) => sum + row.calculatedValue, 0),
          average: calculatedRows.reduce((sum, row) => sum + row.calculatedValue, 0) / calculatedRows.length
        },
        details: {
          operation: calculationTypes.find(t => t.value === calculationType)?.label,
          sourceColumns,
          targetColumn,
          dataRange: range
        }
      };

      setCalculationResult(calculationData);
      setDataRange(range);
      onCalculationComplete(calculationData);
      message.success(`Đã tính toán ${calculatedRows.length} hàng từ vị trí hàng ${startRow + 1}`);
      
    } catch (error) {
      message.error('Lỗi khi thực hiện tính toán');
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculation = () => {
    setStartRow(null);
    setSourceColumns([]);
    setTargetColumn('');
    setCalculationType('');
    setCalculationResult(null);
    setDataRange([]);
  };

  return (
    <Card>
      <Title level={4}>🧮 Tính Toán Động</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {dataLoading && <Alert message="Đang tải dữ liệu sheet..." type="info" />}
        
        {dataError && (
          <Alert 
            message="Lỗi tải dữ liệu" 
            description="Không thể tải dữ liệu để tính toán."
            type="error" 
          />
        )}

        {/* Smart Data Analysis */}
        {sheetData && showSmartAnalysis && (
          <SmartDataAnalyzer
            fileId={fileId}
            sheetName={sheetName}
            sheetData={sheetData}
            onAnalysisComplete={() => {
              setShowSmartAnalysis(false);
            }}
          />
        )}

        {/* Rest of calculation interface only shows after analysis */}
        {!showSmartAnalysis && (
          <>
            {sheetData && (
              <div>
                <Alert
                  message="📋 Thông tin Sheet"
                  description={`Sheet: ${sheetName} | Tổng dòng: ${sheetData.length} | Cột số: ${availableColumns.length}`}
                  type="info"
                  showIcon
                  action={
                    <Button size="small" onClick={() => setShowSmartAnalysis(true)}>
                      Phân tích lại
                    </Button>
                  }
                />
              </div>
            )}

        {/* Step 1: Select starting position */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                🎯 Bước 1: Chọn hàng bắt đầu
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn hàng bắt đầu lấy dữ liệu..."
                value={startRow}
                onChange={(rowIndex) => {
                  setStartRow(rowIndex);
                  setSourceColumns([]);
                  setTargetColumn('');
                  setCalculationResult(null);
                  
                  // Get data range for preview - let it check all columns automatically
                  if (sheetData && rowIndex !== null) {
                    const range = getDataRange(rowIndex);
                    setDataRange(range);
                  }
                }}
              >
                {Array.from({ length: Math.min(20, sheetData?.length || 0) }, (_, i) => (
                  <Option key={i} value={i}>
                    Hàng {i + 1} {i === 0 ? '(Header)' : '(Dữ liệu)'}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                ⚙️ Bước 2: Chọn loại tính toán
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn phép tính..."
                value={calculationType}
                onChange={setCalculationType}
                disabled={!startRow}
              >
                {calculationTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        {/* Step 3: Select source columns when start row is chosen */}
        {startRow !== null && sheetData && dataRange.length > 0 && (
          <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #91d5ff' }}>
            <Title level={5}>� Bước 3: Chọn cột nguồn để tính toán</Title>
            <p style={{ color: '#666', fontSize: '12px', margin: '0 0 12px 0' }}>
              Tìm thấy {dataRange.length} hàng dữ liệu từ hàng {startRow + 1}. Chọn các cột để thực hiện phép tính:
            </p>
            
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Chọn các cột để tính toán (ví dụ: cột I + cột M = kết quả)"
              value={sourceColumns}
              onChange={setSourceColumns}
              maxTagCount="responsive"
            >
              {/* Lấy tên cột từ hàng được chọn (không phải header) */}
              {Object.keys(sheetData[startRow || 0] || {}).map((columnName) => {
                const currentValue = sheetData[startRow || 0][columnName]; // Lấy dữ liệu từ hàng được chọn
                const isNumeric = !isNaN(parseFloat(String(currentValue)));
                return (
                  <Option key={columnName} value={columnName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>{columnName}</strong></span>
                      <span style={{ 
                        color: isNumeric ? '#52c41a' : '#fa8c16', 
                        fontSize: '11px'
                      }}>
                        {isNumeric ? '🔢' : '📝'} "{String(currentValue || '').substring(0, 15)}"
                      </span>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Card>
        )}

        {/* Step 4: Preview calculation and select target column */}
        {sourceColumns.length > 0 && calculationType && (
          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Title level={5}>📋 Bước 4: Xem trước và chọn cột đích</Title>
            
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  🎯 Cột đích trong template:
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn cột đích (ví dụ: cột L)"
                  value={targetColumn}
                  onChange={setTargetColumn}
                >
                  {Object.keys(sheetData?.[startRow || 0] || {}).map((column) => (
                    <Option key={column} value={column}>
                      Cột {column}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col span={12}>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                  <Text strong>Công thức:</Text>
                  <div style={{ fontSize: '12px', color: '#1890ff' }}>
                    {sourceColumns.join(` ${calculationType === 'add' ? '+' : calculationType === 'subtract' ? '-' : calculationType === 'multiply' ? '×' : calculationType === 'divide' ? '÷' : '→'} `)} 
                    {targetColumn && ` = ${targetColumn}`}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Preview first few calculations */}
            <div style={{ marginTop: '12px' }}>
              <Text strong>Xem trước tính toán (3 hàng đầu):</Text>
              <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                {dataRange.slice(0, 3).map((row, index) => {
                  const values = sourceColumns.map(col => parseFloat(String(row.data[col])) || 0);
                  let result = 0;
                  switch (calculationType) {
                    case 'add': result = values.reduce((a, b) => a + b, 0); break;
                    case 'subtract': result = values.reduce((a, b, i) => i === 0 ? b : a - b); break;
                    case 'multiply': result = values.reduce((a, b) => a * b, 1); break;
                    case 'divide': result = values.reduce((a, b, i) => i === 0 ? b : a / b); break;
                  }
                  
                  return (
                    <div key={index} style={{ fontSize: '11px', margin: '2px 0', color: '#666' }}>
                      <strong>Hàng {row.rowNumber}:</strong> {values.join(` ${calculationType === 'add' ? '+' : calculationType === 'subtract' ? '-' : calculationType === 'multiply' ? '×' : '÷'} `)} = <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{result.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Calculation Actions */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<CalculatorOutlined />}
              onClick={handleCalculate}
              disabled={!startRow || !sourceColumns.length || !calculationType || isCalculating}
              loading={isCalculating}
            >
              {isCalculating ? 'Đang tính toán...' : 'Thực hiện tính toán'}
            </Button>
            
            {calculationResult && (
              <Button onClick={resetCalculation}>
                Tính toán mới
              </Button>
            )}
          </Space>
        </div>

        {/* Calculation Result */}
        {calculationResult && (
          <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
              ✅ Kết quả tính toán
            </Title>
            <Row gutter={[16, 8]} style={{ marginTop: '16px' }}>
              <Col span={8}>
                <strong>Vị trí bắt đầu:</strong> Hàng {calculationResult.startPosition.row}
              </Col>
              <Col span={8}>
                <strong>Cột nguồn:</strong> {calculationResult.startPosition.columns.join(', ')}
              </Col>
              <Col span={8}>
                <strong>Số hàng tính:</strong> {calculationResult.summary.totalRows}
              </Col>
            </Row>
            
            <div style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#52c41a',
              margin: '16px 0'
            }}>
              📊 {calculationResult.details.operation} | 
              Tổng cộng: {calculationResult.summary.total.toFixed(2)} | 
              Trung bình: {calculationResult.summary.average.toFixed(2)}
            </div>

            <Alert 
              message="📍 Chi tiết tính toán"
              description={
                <div>
                  <Text type="secondary">Công thức áp dụng cho mỗi hàng:</Text>
                  <div style={{ marginTop: 8, fontSize: '13px' }}>
                    • <strong>Cột nguồn:</strong> {calculationResult.details.sourceColumns.join(' + ')}<br/>
                    • <strong>Phép tính:</strong> {calculationResult.details.operation}<br/>
                    • <strong>Cột đích:</strong> {calculationResult.targetColumn || 'Chưa chọn'}<br/>
                    • <strong>Kết quả sẵn sàng</strong> để ghi vào template!
                  </div>
                </div>
              }
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />

            {/* Show detailed results */}
            <details style={{ marginTop: '12px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Xem chi tiết {calculationResult.calculatedRows.length} hàng tính toán
              </summary>
              <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '8px' }}>
                {calculationResult.calculatedRows.map((row: any, index: number) => (
                  <div key={index} style={{ 
                    padding: '4px 8px', 
                    margin: '2px 0',
                    background: index % 2 === 0 ? '#f9f9f9' : '#fff',
                    fontSize: '11px',
                    borderRadius: '2px'
                  }}>
                    <strong>Hàng {row.rowNumber}:</strong> {row.sourceValues.join(' + ')} = 
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}> {row.calculatedValue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        )}
          </>
        )}
      </Space>
    </Card>
  );
};

const DataPreview: React.FC<{ 
  data: any; 
  fileId: number; 
  sheetName: string 
}> = ({ fileId, sheetName }) => {
  const { data: sheetData, isLoading, error } = useGetSheetData(fileId, sheetName);
  
  return (
    <Card>
      <Title level={4}>👁️ Preview Dữ Liệu</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {isLoading && <Alert message="Đang tải dữ liệu..." type="info" />}
        
        {error && (
          <Alert 
            message="Lỗi tải dữ liệu" 
            description="Không thể tải được dữ liệu từ sheet."
            type="error" 
          />
        )}
        
        {sheetData && sheetData.length > 0 ? (
          <div>
            <p>📊 Hiển thị {Math.min(sheetData.length, 20)} / {sheetData.length} dòng đầu tiên:</p>
            
            {/* Simple table preview */}
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#fafafa', position: 'sticky', top: 0 }}>
                  <tr>
                    {Object.keys(sheetData[0] || {}).map((column) => (
                      <th 
                        key={column}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #d9d9d9',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetData.slice(0, 20).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {Object.keys(sheetData[0] || {}).map((column) => (
                        <td 
                          key={column}
                          style={{
                            padding: '6px 12px',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '11px',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {String(row[column] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {sheetData.length > 20 && (
              <p style={{ textAlign: 'center', color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
                ... và {sheetData.length - 20} dòng khác
              </p>
            )}
          </div>
        ) : sheetData && sheetData.length === 0 ? (
          <Alert message="Sheet không có dữ liệu" type="warning" />
        ) : null}
      </Space>
    </Card>
  );
};

export { FileUpload, ProvinceUnitSelector, SheetSelector, ColumnCalculator, DataPreview, SmartDataAnalyzer, TemplateManager };
