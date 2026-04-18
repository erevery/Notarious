import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminOrderDetailComponent } from './order-detail';

describe('AdminOrderDetailComponent', () => {
  let fixture: ComponentFixture<AdminOrderDetailComponent>;
  let component: AdminOrderDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrderDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'A-88349' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('creates a real order detail screen from the route param', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(host.querySelector('[data-testid="order-detail-title"]')?.textContent).toContain(
      'г. Екатеринбург, ул. Ленина, д. 52',
    );
    expect(host.textContent).toContain('Лента аудита заказа');
    expect(host.textContent).toContain('События безопасности');
  });
});
