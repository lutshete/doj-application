import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  users: any[] = [];
  userForm: FormGroup;
  applicationDatesForm: FormGroup;
  editingUser: any = null;
  previousDates: any[] = [];
  searchQuery: string = ''; // <-- Added searchQuery variable
  currentPageUsers: number = 0;
pageSizeUsers: number = 5;
  userData: any;
  currentApplicationDate: any = null; 
  showNewDateForm: boolean = false; 
  previousApplicationDates: any[] = [];
  cantDelete:boolean
  meetingForm: FormGroup;
  meetings: any;
  

  constructor(private fb: FormBuilder, private adminService:AdminService, private authService: AuthService) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['official', Validators.required],
      isActive:[false, Validators.required]
    });

    this.userForm.get('firstName').disable()
    this.userForm.get('lastName').disable()

    this.applicationDatesForm = this.fb.group(
      {
        openingDate: ['', Validators.required],
        closingDate: ['', Validators.required]
      },
      { validator: this.validateDateRange.bind(this) } // ✅ Apply custom validator here
    );

    this.meetingForm = this.fb.group(
      {
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
        meetingLink: ['']
      },
      { validators: [this.meetingValidateDateRange, this.validateTimeRange] } // Custom validator
    );

    this.meetingForm.get('startDate')?.valueChanges.subscribe((startDateValue) => {
      const closingDateControl = this.applicationDatesForm.get('closingDate');
  
      if (!closingDateControl || !closingDateControl.value) {
        console.warn("Opening Date is not available yet.");
        return;
      }
  
      const closingDate = new Date(closingDateControl.value);
      const startDate = new Date(startDateValue);
      console.log(closingDate <= startDate)
      if (startDate <= closingDate) {
        this.meetingForm.get('startDate')?.setErrors({ invalidStartDate: true });
      } else {
        this.meetingForm.get('startDate')?.setErrors(null);
      }
    });
  }
  validateDateRange(formGroup: AbstractControl) {
    const openingDateControl = formGroup.get('openingDate');
    const closingDateControl = formGroup.get('closingDate');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // ✅ Normalize today's date for accurate comparison

    const openingDate = new Date(openingDateControl?.value);
    const closingDate = new Date(closingDateControl?.value);

    if (!openingDate || !closingDate) return null; // ✅ No validation if empty

    const timeDiff = closingDate.getTime() - openingDate.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

    // ✅ Disable the Opening Date field if the date has already passed
    if (openingDate <= today) {
        openingDateControl?.disable({ onlySelf: true, emitEvent: false });
        this.cantDelete = false
    }else{
      this.cantDelete = true
    }

    // ✅ If updating an existing period (opening date is disabled)
    console.log(openingDateControl)
    if (openingDateControl?.disabled) {
        const currentClosingDate = new Date(this.currentApplicationDate.closingDate); // Get current closing date
        const maxExtensionDate = new Date(currentClosingDate);
        maxExtensionDate.setDate(maxExtensionDate.getDate() + 7); // ✅ Allow only a 1-week extension

        if (closingDateControl?.dirty && closingDate > maxExtensionDate) {
            return { invalidExtension: true }; // ❌ Show error only if user tries to extend closing date by more than 1 week
        }
    } 
    else {
        // ✅ Regular validation for new periods
        if (openingDate >= closingDate) {
            return { invalidDateRange: true }; // ❌ Opening Date must be before Closing Date
        }

        if (daysDiff < 21 || daysDiff > 28) {
            return { invalidDuration: true }; // ❌ Closing Date must be between 3 to 4 weeks
        }
    }

    return null; // ✅ Valid
}


meetingValidateDateRange(formGroup: AbstractControl) {
  const startDateControl = formGroup.get('startDate');
  const endDateControl = formGroup.get('endDate');

  const startDate = new Date(startDateControl?.value);
  const endDate = new Date(endDateControl?.value);

  if (!startDate || !endDate) return null; // No validation if fields are empty

  // ✅ Ensure error triggers only when `endDate` is modified
  if (endDateControl?.dirty && endDate <= startDate) {
    return { invalidDateRange: true }; // ❌ End Date must be after Start Date
  }

  return null; // ✅ Valid
}


validateTimeRange(formGroup: AbstractControl) {
  const startTime = formGroup.get('startTime')?.value;
  const endTime = formGroup.get('endTime')?.value;

  if (!startTime || !endTime) return null; // No validation if empty

  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  if (end <= start) {
    return { invalidTimeRange: true }; // ❌ End Time must be after Start Time
  }

  return null; // ✅ Valid
}




  ngOnInit(): void {
    this.loadData();

    this.userData = this.authService.decodeToken();
    console.log('Decoded User Data:', this.userData); 
  }

  

  


  loadData() {
/*     this.users = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'johndoe@example.com', role: 'official', isActive: true },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'janesmith@example.com', role: 'liquidator', isActive: false },
      { id: 3, firstName: 'Alice', lastName: 'Brown', email: 'alicebrown@example.com', role: 'chief master', isActive: true },
      { id: 3, firstName: 'Alice', lastName: 'Brown', email: 'alicebrown@example.com', role: 'chief master', isActive: true },
    
    ]; */

    this.adminService.getUsers().subscribe(users => {
      this.users  = users
      console.log(this.users);
    });

    this.loadCurrentApplicationDate()
    this.loadPreviousApplicationDates()
  
   
/*   
    this.previousDates = [
      { openingDate: '2024-01-01', closingDate: '2024-03-30' },
      { openingDate: '2024-04-01', closingDate: '2024-06-30' },
      { openingDate: '2024-04-01', closingDate: '2024-06-30' }
    ]; */
  }



  
  // Search Functionality
  filteredUsers() {
    if (!this.searchQuery.trim()) return this.users; // If no search input, return all users

    return this.users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  addUser() {
    if (this.userForm.valid) {
      const newUser = { id: this.users.length + 1, ...this.userForm.value, isActive: true };
      this.users.push(newUser);
      this.userForm.reset();
    }
  }

  editUser(user: any) {
    this.editingUser = user;
    this.userForm.patchValue(user);
  }

  cancelEdit() {
    this.userForm.reset(); // Reset the form fields to initial state
    this.editingUser = null; // Clear the selected user
  }
  

  updateUser() {
    console.log()
    if (this.editingUser) {
      const userId = this.editingUser.id
      this.users = this.users.map(user => user.id === this.editingUser.id ? { ...user, ...this.userForm.value } : user);
      this.editingUser = null;
      this.adminService.updateUser(userId,this.userForm.value).subscribe(response => {
        console.log(response);
      });
      this.userForm.reset();
    }
  }

  // Confirmation before deleting a user
  disableUser(userId: number) {
    if (confirm('Are you sure you want to de-activate this user?')) {
      
      this.adminService.deActivateUser(userId).subscribe(response => {
        console.log(response);
      });
      
    }
  }

  deleteUser(userId: number) {
    this.users = this.users.filter(user => user.id !== userId);
  }

  toggleUserStatus(user: any) {
    user.isActive = !user.isActive;
  }

/*   saveApplicationDates() {

    const payload = {
      openingDate: this.applicationDatesForm.get("openingDate").value,
      closingDate: this.applicationDatesForm.get("closingDate").value,
      createdBy: this.userData.userId

    }
    this.adminService.creaApplicationDates(payload).subscribe((response) => {
      console.log(response)
    })
  } */

  loadCurrentApplicationDate() {
    this.adminService.getCurrentApplicationDate().subscribe(response => {
      
      this.currentApplicationDate = response.currentApplicationDate;
      console.log(this.currentApplicationDate.openingDate)
      const openingDate = new Date(this.currentApplicationDate.openingDate).toISOString().split('T')[0]
      const closingDate = new Date(this.currentApplicationDate.closingDate).toISOString().split('T')[0]
      this.applicationDatesForm.patchValue({
        openingDate: openingDate,
        closingDate: closingDate
       });
       const today = new Date();
       this.getMeeting()
    
  
      this.showNewDateForm = !this.currentApplicationDate; // Show new date form if no active period
    });
  }

  isObjectNotEmpty(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  loadPreviousApplicationDates() {
    this.adminService.getPreviousApplicationDates()
      .subscribe(response => {
        console.log(response)
        this.previousApplicationDates = response;
      });
  }
  
  saveApplicationDates() {
    if (this.applicationDatesForm.valid) {
      const payload = {
        openingDate: this.applicationDatesForm.get("openingDate").value,
        closingDate: this.applicationDatesForm.get("closingDate").value,
        createdBy: this.userData.userId
  
      }

      const payloadUpdate = {
        openingDate: this.applicationDatesForm.get("openingDate").value,
        closingDate: this.applicationDatesForm.get("closingDate").value,    
  
      }


      if (this.currentApplicationDate) {
        // ✅ Update existing application dates
        this.adminService.updateApplicationDates(payloadUpdate).subscribe(response => {
          alert(response.message);
          this.loadCurrentApplicationDate();
        });
      } else {
        // ✅ Create new application dates
        this.adminService.creaApplicationDates(payload).subscribe(response => {
          alert(response.message);
          this.loadCurrentApplicationDate();
        });
      }
    }
  }

  // Statistics Functions
  getTotalUsers(): number {
    return this.users.length;
  }

  getAdminCount(): number {
    return this.users.filter(user => user.role === 'official').length;
  }

  getLiquidatorCount(): number {
    return this.users.filter(user => user.role === 'liquidator').length;
  }

  getChiefMasterCount(): number {
    return this.users.filter(user => user.role === 'chief master').length;
  }

  get paginatedUsers() {
    return this.users.slice(this.currentPageUsers * this.pageSizeUsers, (this.currentPageUsers + 1) * this.pageSizeUsers);
  }
  
  nextPageUsers() {
    if ((this.currentPageUsers + 1) * this.pageSizeUsers < this.users.length) {
      this.currentPageUsers++;
    }
  }
  
  prevPageUsers() {
    if (this.currentPageUsers > 0) {
      this.currentPageUsers--;
    }
  }
  
  currentPageDates: number = 0;
  pageSizeDates: number = 4;
  
  get paginatedDates() {
    return this.previousApplicationDates.slice(this.currentPageDates * this.pageSizeDates, (this.currentPageDates + 1) * this.pageSizeDates);
  }
  
  nextPageDates() {
    if ((this.currentPageDates + 1) * this.pageSizeDates < this.previousDates.length) {
      this.currentPageDates++;
    }
  }
  
  prevPageDates() {
    if (this.currentPageDates > 0) {
      this.currentPageDates--;
    }
  }

  deleteApplicationDates() {
 this.loadCurrentApplicationDate(); 
 const dateID = this.currentApplicationDate.id

    this.adminService.deleteApplicationDate(dateID).subscribe(response => {
     if(response){
      this.applicationDatesForm.reset()
     }
      
    });
    alert('Application dates deleted successfully!');
  }

 

  scheduleMeeting() {
    if (this.meetingForm.valid) {
      this.loadCurrentApplicationDate(); 
  
      const meetingData = {
        startDate: this.meetingForm.value.startDate,
        endDate: this.meetingForm.value.endDate,
        startTime: this.meetingForm.value.startTime,
        endTime: this.meetingForm.value.endTime,
        meetingLink: this.meetingForm.value.meetingLink,
        venue: this.meetingForm.value.meetingLink,
        createdBy: this.userData.userId,
        currentApplicationDateId: this.currentApplicationDate?.id 
      };
  
      console.log('Meeting Data:', meetingData);
  
      if (this.meetings) {
        // **Update existing meeting**
        this.adminService.updateMeeting(this.meetings.id, meetingData).subscribe(
          (response) => {
            alert('Meeting updated successfully!');
            this.handleModalClose();
            this.getMeeting(); // Refresh meeting list
          },
          (error) => {
            console.error('Error updating meeting:', error);
            alert('Failed to update the meeting. Please try again.');
          }
        );
      } else {
        // **Create new meeting**
        this.adminService.createMeeting(meetingData).subscribe(
          (response) => {
            alert('Meeting scheduled successfully!');
            this.handleModalClose();
            this.getMeeting(); // Refresh meeting list
          },
          (error) => {
            console.error('Error scheduling meeting:', error);
            alert('Failed to schedule the meeting. Please try again.');
          }
        );
      }
    }
  }
  
  // ✅ **Helper function to close modal properly**
  handleModalClose() {
    const modalElement = document.getElementById('addMeetingModal');
    if (modalElement) {
      const modalInstance = Modal.getInstance(modalElement);
      modalInstance?.hide(); // Close modal properly
    }
    this.meetingForm.reset();
  }
  

  getMeeting(){
    this.adminService.getMeeting(this.currentApplicationDate.id ).subscribe(
      (data) => {
        console.log('Meetings:', data);
        this.meetings = data;
      },
      (error) => {
        console.error('Error fetching meetings:', error);
      }
    );
    
  }

  onOpenMeetingModal() {
    if (this.meetings) {
      // ✅ Patch the form with existing meeting details

      const formattedStartDate = this.formatDate(this.meetings.startDate);
      const formattedEndDate = this.formatDate(this.meetings.endDate);
      this.meetingForm.patchValue({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        startTime: this.meetings.startTime,
        endTime: this.meetings.endTime,
        meetingLink: this.meetings.meetingLink,
        venue: this.meetings.venue
      });
    } else {
      // ✅ Reset the form for a new meeting
      this.meetingForm.reset();
    }
  }

  formatDate(isoString: string): string {
    if (!isoString) return '';
  
    const date = new Date(isoString);
    return date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
  }
  
  download() {
    const barcode = '987654321'; // Example barcode value
    this.adminService.downloadExcel(barcode);
  }
  
}
