// angular import
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';


// icons
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { TrackingService } from 'src/app/services/tracking.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-track',

  templateUrl: './track.component.html',
  styleUrl: './track.component.scss'
})
export class TrackComponent {
  currentPeriod: any;
  allApplications: any;
  summary: any;
  searchQuery: string = '';
  statusFilter: string = 'all';
  openingDate: string = '';
  closingDate: string = '';
  provinceFilter: string = 'all';
  // constructor

  provinces: string[] = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ];

  constructor(
    private iconService: IconService,
    private trackingService: TrackingService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }

  ngOnInit() {
    this.getCurrentPeriod()
    this.getAllApplications()
    this. getSummary()
  }

  getCurrentPeriod() {
    this.trackingService.getCurrentPeriod().subscribe({
      next: (response) => {
        console.log(response);
        if (response) {
          this.currentPeriod = response
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  getAllApplications() {
    this.trackingService.getAllApplications().subscribe({
      next: (response) => {
        console.log(response);
        if (response) {
          this.allApplications = response
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  getSummary() {
    this.trackingService.getSummaryData().subscribe({
      next: (response) => {
        console.log(response);
        if (response) {
          this.summary = response
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  filterApplications() {
    // Reset allApplications to ensure no old data is shown
    this.allApplications = [];
    this.cdr.detectChanges();

    const filters = {
        search: this.searchQuery,
        status: this.statusFilter !== 'all' ? this.statusFilter : '',
        openingDate: this.openingDate,
        closingDate: this.closingDate
    };

    this.trackingService.filterApplications(filters).subscribe({
        next: (response) => {
            // Assign the new filtered data to allApplications
            this.allApplications = response;
        },
        error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
        }
    });
}



  onFilterChange() {
    this.filterApplications();
  }

  reviewApplication(id: string | number) {
    this.router.navigate([`/review-application/${id}`]);
  }
  

  
}
