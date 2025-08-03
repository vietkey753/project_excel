import React, { useState } from 'react';
import { 
  Steps, 
  Card, 
  Typography, 
  Space, 
  Button, 
  message,
  Row,
  Col 
} from 'antd';
import { 
  UploadOutlined,
  DatabaseOutlined, 
  CalculatorOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';
import { excelApi } from '../services/api';
import { 
  FileUpload, 
  SheetSelector, 
  DataPreview
} from './PlaceholderComponents';
import TemplateUpload from './TemplateUpload';
import MultiDataMerger from './MultiDataMerger';
import SmartDataAnalyzer from './SmartDataAnalyzer';
import { useMergeAndDownload } from '../hooks/useExcelApi';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileId, setFileId] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<Record<string, any>[]>([]);
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any[]>([]);
  const [templateMappings, setTemplateMappings] = useState<any>(null);
  
  // Template states
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateSheet, setTemplateSheet] = useState<string | null>(null);
  const [templateColumns, setTemplateColumns] = useState<string[]>([]);

  // Merge and download hook
  const mergeDownloadMutation = useMergeAndDownload();

  // Debug logging
  console.log('HomePage render - State:', {
    currentStep,
    fileId,
    selectedSheet,
    templateId,
    templateSheet,
    calculationResults: calculationResults.length > 0
  });

  const steps = [
    {
      title: 'Upload Data File',
      icon: <UploadOutlined />,
      description: 'Tải file Excel cần tính toán',
    },
    {
      title: 'Upload Template',
      icon: <DatabaseOutlined />,
      description: 'Tải file mẫu để chèn kết quả',
    },
    {
      title: 'Chọn Sheet Data',
      icon: <DatabaseOutlined />,
      description: 'Chọn sheet trong file data',
    },
    {
      title: 'Tính toán',
      icon: <CalculatorOutlined />,
      description: 'Thực hiện tính toán trên data',
    },
    {
      title: 'Data Merging',
      icon: <DatabaseOutlined />,
      description: 'Chèn kết quả vào template',
    },
    {
      title: 'Export',
      icon: <DownloadOutlined />,
      description: 'Xuất file Excel mới',
    },
  ];

  const handleFileUpload = (uploadedFileId: number) => {
    setFileId(uploadedFileId);
    setCurrentStep(1);
    message.success('File uploaded successfully!');
  };

  const handleTemplateSelect = (templateFileId: number, sheetName: string, columns: string[]) => {
    setTemplateId(templateFileId);
    setTemplateSheet(sheetName);
    setTemplateColumns(columns);
    setCurrentStep(2);
    message.success(`Template selected: ${sheetName} with ${columns.length} columns!`);
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setIsLoadingSheetData(true);
    
    // Load sheet data for analysis and calculation
    if (fileId) {
      try {
        const data = await excelApi.getSheetData(fileId, sheetName);
        setSheetData(data);
        message.success(`Đã tải ${data.length} hàng dữ liệu từ sheet ${sheetName}`);
      } catch (error) {
        console.error('Error loading sheet data:', error);
        message.error('Lỗi khi tải dữ liệu sheet');
        setSheetData([]);
      } finally {
        setIsLoadingSheetData(false);
      }
    }
    
    setCurrentStep(3);
  };

  const handleCalculationComplete = (results: any[]) => {
    setCalculationResults(results);
    setCurrentStep(4);
  };

  const handleDataMergingComplete = (mergedData: any) => {
    console.log('🔄 handleDataMergingComplete called with:', mergedData);
    console.log('📋 Data type:', typeof mergedData);
    console.log('📋 Is array:', Array.isArray(mergedData));
    
    setTemplateMappings(mergedData);
    setCurrentStep(5);
    message.success('Chèn dữ liệu vào template thành công!');
  };

  const handleDownloadMergedFile = async () => {
    console.log('🔄 handleDownloadMergedFile called');
    console.log('📦 templateMappings:', templateMappings);
    
    if (!templateMappings) {
      message.error('Không có dữ liệu merge để download');
      console.log('❌ No templateMappings available');
      return;
    }

    try {
      console.log('🚀 Starting merge and download...');
      console.log('📤 Sending data:', templateMappings);
      
      const blob = await mergeDownloadMutation.mutateAsync(templateMappings);
      console.log('✅ Received blob:', blob);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_result_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Tải file Excel thành công!');
      console.log('📁 File downloaded successfully');
      
      // Quay về trang đầu sau 2 giây
      setTimeout(() => {
        resetProcess();
        message.info('Quay lại trang chính để thực hiện lại quy trình');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      message.error('Lỗi khi tải file: ' + (error as Error).message);
    }
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setFileId(null);
    setSelectedSheet(null);
    setSheetData([]);
    setCalculationResults([]);
    setTemplateMappings(null);
    setTemplateId(null);
    setTemplateSheet(null);
    setTemplateColumns([]);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2}>
            <UploadOutlined style={{ marginRight: '8px' }} />
            Phần Mềm Xử Lý Excel
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            Upload Data → Upload Template → Chọn Sheet → Tính toán → Merge Data → Export
          </Paragraph>
        </div>

        {/* Steps */}
        <Card>
          <Steps 
            current={currentStep} 
            items={steps}
            style={{ marginBottom: '24px' }}
          />
          
          <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
            <Col span={24}>
              {/* Step 0: File Upload */}
              {currentStep === 0 && (
                <div>
                  <h3>Step 0: Upload Data File</h3>
                  <FileUpload onUploadSuccess={handleFileUpload} />
                </div>
              )}
              
              {/* Step 1: Template Upload */}
              {currentStep === 1 && (
                <div>
                  <h3>Step 1: Upload Template File</h3>
                  <p>Data FileId: {fileId}</p>
                  <TemplateUpload onTemplateSelect={handleTemplateSelect} />
                </div>
              )}
              
              {/* Step 2: Sheet Selection */}
              {currentStep === 2 && (
                <div>
                  <h3>Step 2: Chọn Sheet Data</h3>
                  <p>Data FileId: {fileId} | Template: {templateId} ({templateSheet})</p>
                  <p>Template có {templateColumns.length} cột: {templateColumns.slice(0, 5).join(', ')}{templateColumns.length > 5 ? '...' : ''}</p>
                  {fileId ? (
                    <SheetSelector fileId={fileId} onSheetSelect={handleSheetSelect} />
                  ) : (
                    <div>Missing data file for sheet selection</div>
                  )}
                </div>
              )}
              
              {/* Step 3: Column Calculator */}
              {currentStep === 3 && (
                <div>
                  <h3>Step 3: Tính toán trên Data</h3>
                  <p>Data File: {fileId}, Sheet: {selectedSheet}</p>
                  <p>Đã tải: {sheetData.length} hàng dữ liệu</p>
                  <p>Template sẵn sàng: {templateId} ({templateSheet}) với {templateColumns.length} cột</p>
                  {fileId && selectedSheet && sheetData.length > 0 ? (
                    <SmartDataAnalyzer 
                      fileId={fileId} 
                      sheetName={selectedSheet}
                      sheetData={sheetData}
                      onCalculationComplete={handleCalculationComplete}
                      onAnalysisComplete={(analysis: any) => console.log('Analysis:', analysis)}
                    />
                  ) : (
                    <div>
                      {isLoadingSheetData ? 'Đang tải dữ liệu sheet...' : 
                       sheetData.length === 0 ? 'Chưa có dữ liệu sheet' : 
                       'Missing data for calculation'}
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 4: Data Merging */}
              {currentStep === 4 && calculationResults.length > 0 && (
                <div>
                  <h3>Step 4: Chèn Kết Quả vào Template</h3>
                  <MultiDataMerger
                    calculationResults={calculationResults}
                    templateId={templateId!}
                    templateSheet={templateSheet!}
                    templateColumns={templateColumns}
                    onMergeComplete={handleDataMergingComplete}
                  />
                </div>
              )}
              
              {/* Step 5: Export */}
              {currentStep === 5 && templateMappings && (
                <div>
                  <h3>Step 5: Export File Hoàn Chỉnh</h3>
                  <p>✅ Data đã được chèn vào template thành công!</p>
                  {calculationResults.length > 0 ? (
                    <DataPreview 
                      data={calculationResults[0]}
                      fileId={fileId!}
                      sheetName={selectedSheet!}
                    />
                  ) : (
                    <div>No calculation results available</div>
                  )}
                </div>
              )}

              {/* Fallback for unknown step */}
              {(currentStep < 0 || currentStep > 5) && (
                <div>Unknown step: {currentStep}</div>
              )}
            </Col>
          </Row>

          {/* Action Buttons */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Quay lại
                </Button>
              )}
              
              {currentStep === 5 && (
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadMergedFile}
                  loading={mergeDownloadMutation.isPending}
                >
                  Download Merged Excel
                </Button>
              )}
              
              <Button onClick={resetProcess}>
                Bắt đầu lại
              </Button>
            </Space>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default HomePage;
