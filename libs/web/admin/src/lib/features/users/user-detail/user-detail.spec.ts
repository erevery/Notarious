import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminUserDetailComponent } from './user-detail';

describe('AdminUserDetailComponent', () => {
  let fixture: ComponentFixture<AdminUserDetailComponent>;
  let component: AdminUserDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'U-2011' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('creates a real user detail screen from the route param', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(host.querySelector('[data-testid="user-detail-title"]')?.textContent).toContain(
      'Ирина Соколова',
    );
    expect(host.textContent).toContain('Лента аудита пользователя');
    expect(host.textContent).toContain('События безопасности');
  });
});
