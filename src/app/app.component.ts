import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as XLSX from 'xlsx';

interface LossData {
  accident_month: string;
  report_month: string;
  total_loss: number;
}

interface ExcelRow {
  accident_month: string;
  report_month: string;
  total_loss: string | number;
  [key: string]: any;
}

interface LinkRatio {
  accidentMonth: string;
  period: string;
  ratio: number;
}

interface DevelopmentFactors {
  period: number;
  factor: number;
}

interface IBNRResult {
  accidentMonth: string;
  latestKnown: number;
  cdf: number;
  ultimateLoss: number;
  ibnr: number;
}

interface IBNRSummary {
  results: IBNRResult[];
  totalIBNR: number;
}


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html'
  
})
export class AppComponent {
  title = 'exercise';
  showTable = false;
  showLinkRatios = false;
  showIBNRResults = false;
  errorMessage = '';
  pivotData: { [key: string]: { [key: string]: number } } = {};
  linkRatios: LinkRatio[] = [];
  accidentMonths: string[] = [];
  reportMonths: string[] = [];
  developmentPeriods: string[] = [];
  rawData: LossData[] = [];
  ibnrResults: IBNRSummary | null = null;
  averageFactors: DevelopmentFactors[] = [];


  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) {
      this.errorMessage = 'No file selected';
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['xlsx', 'xls'].includes(fileExtension ?? '')) {
      this.errorMessage = 'Please upload only Excel files (.xlsx, .xls)';
      target.value = '';
      return;
    }

    try {
      await this.readExcelFile(file);
      if (this.rawData.length > 0) {
        this.errorMessage = '';
        this.generateLossTriangle();
      } else {
        this.errorMessage = 'No valid data found in the file';
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? 
        `Error processing file: ${error.message}` : 
        'Error processing file. Please check the file format.';
      console.error('File processing error:', error);
    }
  }

  private async readExcelFile(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        // Directly use e.target?.result without Uint8Array
        const workbook = XLSX.read(e.target?.result as ArrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet, {
          header: ['accident_month', 'report_month', 'total_loss'],
          range: 1
        });
  
        this.rawData = jsonData
          .filter(row => row.accident_month && row.report_month && row.total_loss)
          .map(row => ({
            accident_month: this.formatExcelDate(row.accident_month),
            report_month: this.formatExcelDate(row.report_month),
            total_loss: this.parseExcelNumber(row.total_loss)
          }))
          .filter(row => !isNaN(row.total_loss) && row.total_loss !== null);
  
        resolve();
      };
  
      reader.onerror = () => {
      };
  
      reader.readAsArrayBuffer(file);
    });
  }
  
  
  private formatExcelDate(value: string | number): string {
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}`;
    }
    
    const match = String(value).match(/^(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return String(value);
  }

  private parseExcelNumber(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    const numValue = Number(String(value).replace(/,/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  }

  private processData(): void {
    if (!this.rawData.length) return;

    const accidentMonthSet = new Set<string>();
    const reportMonthSet = new Set<string>();
    const tempPivot: { [key: string]: { [key: string]: number } } = {};

    this.rawData.forEach(row => {
      accidentMonthSet.add(row.accident_month);
      reportMonthSet.add(row.report_month);
    });

    this.accidentMonths = Array.from(accidentMonthSet).sort();
    this.reportMonths = Array.from(reportMonthSet).sort();

    this.accidentMonths.forEach(accMonth => {
      tempPivot[accMonth] = {};
    });

    this.rawData.forEach(row => {
      if (!tempPivot[row.accident_month]) {
        tempPivot[row.accident_month] = {};
      }
      tempPivot[row.accident_month][row.report_month] = row.total_loss;
    });

    this.pivotData = tempPivot;
  }

  getPivotValue(accMonth: string, repMonth: string): string {
    const value = this.pivotData[accMonth]?.[repMonth];
    return value !== undefined ? value.toLocaleString() : '';
  }
  

  generateLossTriangle(): void {
    this.showTable = true;
    this.processData();
  }

  calculateLinkRatios(): void {
    this.linkRatios = [];
    this.developmentPeriods = [];
    
    // Calculate number of development periods
    const maxPeriods = this.reportMonths.length - 1;
    this.developmentPeriods = Array(maxPeriods).fill(0);

    // Calculate link ratios for each accident month
    this.accidentMonths.forEach(accMonth => {
      let lastValue: number | null = null;
      
      for (let i = this.reportMonths.length - 1; i >= 0; i--) {
        const currentValue = this.pivotData[accMonth]?.[this.reportMonths[i]];
        
        if (currentValue && lastValue) {
          const ratio = lastValue / currentValue;
          this.linkRatios.push({
            accidentMonth: accMonth,
            period: `${i}`,
            ratio: ratio
          });
        }
        
        if (currentValue) {
          lastValue = currentValue;
        }
      }
    });

    this.showLinkRatios = true;
  }

  getLinkRatio(accMonth: string, periodIndex: number): string {
    const ratio = this.linkRatios.find(
      lr => lr.accidentMonth === accMonth && 
           lr.period === periodIndex.toString()
    )?.ratio;
    
    return ratio ? ratio.toFixed(3) : '';
  }

  getAverageLinkRatio(periodIndex: number): string {
    const ratios: number[] = [];
    
    for (const lr of this.linkRatios) {
        if (lr.period === periodIndex.toString()) {
            ratios.push(lr.ratio);
        }
    }
    
    if (ratios.length === 0) {
        return '';
    }

    let sum = 0;
    for (const ratio of ratios) {
        sum += ratio;
    }

    const average = sum / ratios.length;
    return average.toFixed(3);
}
  
  calculateIBNR(): void {
    this.calculateAverageFactors();
    const results: IBNRResult[] = [];
    
   
    this.accidentMonths.forEach(accMonth => {
      
      const latestKnown = this.getLatestKnownValue(accMonth);
      if (latestKnown === null) return;

     
      const cdf = this.calculateCDF(accMonth);
      
      
      const ultimateLoss = latestKnown * cdf;
      const ibnr = ultimateLoss - latestKnown;

      results.push({
        accidentMonth: accMonth,
        latestKnown,
        cdf,
        ultimateLoss,
        ibnr
      });
    });
    const totalIBNR = results.reduce((sum, result) => sum + result.ibnr, 0);

    this.ibnrResults = {
      results,
      totalIBNR
    };

    this.showIBNRResults = true;
  }

  private calculateAverageFactors(): void {
    this.averageFactors = [];
    const maxPeriods = this.reportMonths.length - 1;

    for (let i = 0; i < maxPeriods; i++) {
        const ratios: number[] = [];
        
        for (const lr of this.linkRatios) {
            if (lr.period === i.toString()) {
                ratios.push(lr.ratio);
            }
        }
        
        if (ratios.length > 0) {
            const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
            this.averageFactors.push({
                period: i + 1,
                factor: average
            });
        }
    }
}

  private getLatestKnownValue(accidentMonth: string): number | null {
    let latestValue: number | null = null;
    
    for (const repMonth of this.reportMonths) {
      const value = this.pivotData[accidentMonth]?.[repMonth];
      if (value !== undefined) {
        latestValue = value;
      }
    }
    
    return latestValue;
  }

  private calculateCDF(accidentMonth: string): number {
    let cdf = 1.0;
    let startPeriod = this.findStartPeriod(accidentMonth);
    
    // Multiply by each remaining development factor
    for (let i = startPeriod; i < this.averageFactors.length; i++) {
      cdf *= this.averageFactors[i].factor;
    }
    
    return cdf;
  }

  private findStartPeriod(accidentMonth: string): number {
    let periodCount = 0;
    for (const repMonth of this.reportMonths) {
      if (this.pivotData[accidentMonth]?.[repMonth] !== undefined) {
        periodCount++;
      }
    }
    return periodCount - 1;
  }
}

