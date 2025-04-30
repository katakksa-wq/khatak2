'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface TranslationRecord {
  [key: string]: string;
}

interface Translations {
  en: TranslationRecord;
  ar: TranslationRecord;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translations;
}

const defaultTranslations: Translations = {
  en: {
    // Common
    'app.title': 'khatak',
    'nav.home': 'Home',
    'nav.orders': 'Orders',
    'nav.tracking': 'Tracking',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'language.switch': 'العربية',
    
    // Homepage
    'homepage.subtitle': 'Fast and reliable shipping service for all your needs',
    'homepage.services.0.title': 'Express Delivery',
    'homepage.services.0.description': 'Same-day delivery service for urgent packages',
    'homepage.services.1.title': 'Package Tracking',
    'homepage.services.1.description': 'Real-time tracking of your shipments',
    'homepage.services.2.title': 'Secure Handling',
    'homepage.services.2.description': 'Your packages are always handled with care',
    'homepage.howItWorks.0.title': 'Create an order',
    'homepage.howItWorks.0.description': 'Fill in the shipping details',
    'homepage.howItWorks.1.title': 'Schedule pickup',
    'homepage.howItWorks.1.description': 'We\'ll collect your package',
    'homepage.howItWorks.2.title': 'Track delivery',
    'homepage.howItWorks.2.description': 'Monitor your shipment in real-time',
    'homepage.cta.title': 'Ready to Ship?',
    'homepage.cta.subtitle': 'Sign up now and send your first package today',
    'homepage.cta.buttonText': 'Get Started',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.phone': 'Phone',
    'auth.address': 'Address',
    'auth.confirmPassword': 'Confirm Password',
    'auth.createPassword': 'Create a password',
    'auth.confirmPasswordPlaceholder': 'Confirm password',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.createAccount': 'Creating Account...',
    
    // Admin
    'admin.title': 'Administrator',
    'admin.client': 'Client',
    'admin.driver': 'Driver',
    'admin.allOrders': 'All Orders',
    'admin.manageUsers': 'Manage Users',
    'admin.driverApprovals': 'Driver Approvals',
    'admin.paymentManagement': 'Payment Management',
    'admin.orderManagement': 'Order Management',
    'admin.searchOrders': 'Search by order #, customer, or address',
    'admin.search': 'Search',
    'admin.allStatuses': 'All Statuses',
    'admin.refresh': 'Refresh',
    'admin.orderNumber': 'Order #',
    'admin.customer': 'Customer',
    'admin.status': 'Status',
    'admin.pickupAddress': 'Pickup Address',
    'admin.deliveryAddress': 'Delivery Address',
    'admin.created': 'Created',
    'admin.amount': 'Amount',
    'admin.actions': 'Actions',
    'admin.details': 'Details',
    
    // Driver
    'driver.becomeDriver': 'Want to become a driver?',
    'driver.earnMoney': 'Earn money by delivering packages',
    'driver.registration': 'Driver Registration',
    
    // Orders
    'orders.title': 'My Orders',
    'orders.new': 'Create New Order',
    'orders.track': 'Track Order',
    'orders.details': 'Order Details',
    'orders.available': 'Available Orders',
    'orders.current': 'Current Orders',
    'orders.history': 'Orders History',
    'orders.viewCurrentOrders': 'View Current Orders',
    'orders.haveActiveOrder': 'You Have an Active Order',
    'orders.oneOrderAtTime': 'You can only accept one order at a time. Please complete or cancel your current order before accepting a new one.',
    'orders.lookingToAccept': 'Looking for orders to accept?',
    'orders.pendingDescription': 'All orders with PENDING status are shown here. Once you accept an order, it will appear in your Current Orders.',
    'orders.loadingAvailable': 'Loading available orders...',
    'orders.noAvailable': 'No Available Orders',
    'orders.checkBackLater': 'There are currently no available orders to accept. Please check back later.',
    'orders.orderNumber': 'Order #',
    'orders.acceptOrder': 'Accept Order',
    'orders.acceptingOrder': 'Accepting...',
    'orders.weightUnit': 'lbs',
    'orders.distanceUnit': 'miles',
    'orders.distance': 'Distance',
    'orders.timeUnit': 'mins',
    'orders.estimatedTime': 'Est. Time',
    'orders.fragileWarning': 'Fragile - Handle with care',
    
    // Payments
    'payment.confirmation': 'Payment Confirmation',
    'payment.history': 'Payment History',
    'payment.unconfirmedLimit': 'Unconfirmed Payments Limit Reached',
    'payment.unconfirmedDescription': 'You currently have {0} unconfirmed payments. You cannot accept new orders until you confirm your pending payments.',
    'payment.viewPending': 'View Pending Payments',
    
    // User
    'user.profile': 'Profile',
    'user.notifications': 'Notifications',
    
    // Buttons
    'button.submit': 'Submit',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.update': 'Update',
    'button.loading': 'Loading...',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.totalOrders': 'Total Orders',
    'dashboard.activeOrders': 'Active Orders',
    'dashboard.completedOrders': 'Completed Orders',
    'dashboard.cancelledOrders': 'Cancelled Orders',
    'dashboard.pendingOrders': 'Pending Orders',
    'dashboard.recentOrders': 'Recent Orders',
    'dashboard.noRecentOrders': 'No recent orders found',
    'dashboard.trackingNumber': 'Tracking Number',
    'dashboard.status': 'Status',
    'dashboard.createdAt': 'Created At',
    'dashboard.actions': 'Actions',
    'dashboard.viewDetails': 'View Details',
    'dashboard.orderStatus.PENDING': 'Pending',
    'dashboard.orderStatus.IN_TRANSIT': 'In Transit',
    'dashboard.orderStatus.DELIVERED': 'Delivered',
    'dashboard.orderStatus.CANCELLED': 'Cancelled',
    'dashboard.orderStatus.ACCEPTED': 'Accepted',
    'dashboard.orderStatus.PICKED_UP': 'Picked Up',
    
    // Profile
    'profile.editProfile': 'Edit Profile',
    'profile.saving': 'Saving...',
    'profile.updateSuccess': 'Profile updated successfully',
    
    // Order Form
    'orders.fillPickupFields': 'Please fill in all required pickup address fields',
    'orders.fillDeliveryFields': 'Please fill in all required delivery address fields including recipient mobile number',
    'orders.invalidMobile': 'Please enter a valid recipient mobile number',
    'orders.fillPackageDetails': 'Please fill in package weight and price',
    'orders.invalidPrice': 'Please enter a valid price greater than zero',
    'orders.pickup': 'Pickup',
    'orders.delivery': 'Delivery',
    'orders.package': 'Package',
    'orders.location': 'Location',
    'orders.pickupAddress': 'Pickup Address',
    'orders.deliveryAddress': 'Delivery Address',
    'orders.street': 'Street Address',
    'orders.city': 'City',
    'orders.state': 'State',
    'orders.recipientMobile': 'Recipient Mobile Number',
    'orders.packageDetails': 'Package Details & Price',
    'orders.weight': 'Package Weight (lbs)',
    'orders.dimensions': 'Dimensions (LxWxH inches)',
    'orders.description': 'Package Description',
    'orders.fragile': 'This package is fragile',
    'orders.price': 'Enter Price',
    'orders.deliveryLocation': 'Delivery Location',
    'orders.selectLocation': 'Please select the exact delivery location on the map',
    'orders.mapPlaceholder': 'Map would be displayed here',
    'orders.mapIntegration': '(Integration with Google Maps or similar service required)',
    'orders.selectedLocation': 'Selected Location',
    'orders.noLocationSelectedYet': 'No location selected yet',
    'orders.useDeliveryAddress': 'Use Delivery Address',
    'orders.simulateMapSelection': 'Simulate Map Selection',
    'orders.note': 'Note',
    'orders.realImplementation': 'In a real implementation, this would be replaced with an interactive map where users can pinpoint the exact delivery location.',
    'orders.newOrderDescription': 'Fill out the form to create a new shipping order',
    'orders.creating': 'Creating Order...',
    'orders.createOrder': 'Create Order',
    'button.back': 'Back',
    'button.next': 'Next',
    
    // Pagination
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.noOrders': 'No orders found matching your criteria',
    
    // Admin Dashboard
    'admin.dashboard': 'Admin Dashboard',
    'admin.totalUsers': 'Total Users',
    'admin.activeUsers': 'active',
    'admin.totalOrdersCount': 'Total Orders',
    'admin.totalCompleted': 'completed',
    'admin.totalRevenue': 'Total Revenue',
    'admin.revenueGrowth': 'growth',
    'admin.pendingDriversCount': 'Pending Drivers',
    'admin.awaitingApproval': 'Awaiting approval',
    'admin.viewAllUsers': 'View All Users',
    'admin.viewAllOrders': 'View All Orders',
    'admin.revenueDetails': 'Revenue Details',
    'admin.viewPendingDrivers': 'View Pending Drivers',
    'admin.recentOrdersList': 'Recent Orders',
    'admin.recentUsers': 'Recent Users',
    'admin.noRecentOrders': 'No recent orders found',
    'admin.noRecentUsers': 'No recent users found',
    'admin.orderNum': 'Order #',
    'admin.customerName': 'Customer',
    'admin.dateField': 'Date',
    'admin.statusField': 'Status',
    'admin.amountField': 'Amount',
    'admin.nameField': 'Name',
    'admin.emailField': 'Email',
    'admin.roleField': 'Role',
    'admin.joinedDate': 'Joined',
    'admin.lastActive': 'Last Active',
    'admin.viewAll': 'View All',
    'admin.never': 'Never',
    
    // Logout
    'logout.confirmMessage': 'Are you sure you want to log out?',
    
    // Common Loading and Error Messages
    'loading.message': 'Loading...',
    'error.failed': 'Failed to load data. Please try again.',
    'error.auth': 'User data incomplete. Please login again.',
  },
  ar: {
    // Common
    'app.title': 'خطك',
    'nav.home': 'الرئيسية',
    'nav.orders': 'الطلبات',
    'nav.tracking': 'تتبع',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.profile': 'الملف الشخصي',
    'nav.logout': 'تسجيل الخروج',
    'language.switch': 'English',
    
    // Homepage
    'homepage.subtitle': 'خدمة شحن سريعة وموثوقة لجميع احتياجاتك',
    'homepage.services.0.title': 'توصيل سريع',
    'homepage.services.0.description': 'خدمة توصيل في نفس اليوم للطرود العاجلة',
    'homepage.services.1.title': 'تتبع الطرود',
    'homepage.services.1.description': 'تتبع شحناتك في الوقت الفعلي',
    'homepage.services.2.title': 'تعامل آمن',
    'homepage.services.2.description': 'يتم التعامل مع طرودك دائمًا بعناية',
    'homepage.howItWorks.0.title': 'إنشاء طلب',
    'homepage.howItWorks.0.description': 'املأ تفاصيل الشحن',
    'homepage.howItWorks.1.title': 'جدولة الاستلام',
    'homepage.howItWorks.1.description': 'سنقوم بجمع الطرد الخاص بك',
    'homepage.howItWorks.2.title': 'تتبع التوصيل',
    'homepage.howItWorks.2.description': 'مراقبة شحنتك في الوقت الفعلي',
    'homepage.cta.title': 'جاهز للشحن؟',
    'homepage.cta.subtitle': 'اشترك الآن وأرسل طردك الأول اليوم',
    'homepage.cta.buttonText': 'ابدأ الآن',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم',
    'auth.firstName': 'الاسم الأول',
    'auth.lastName': 'اسم العائلة',
    'auth.phone': 'رقم الهاتف',
    'auth.address': 'العنوان',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.createPassword': 'إنشاء كلمة مرور',
    'auth.confirmPasswordPlaceholder': 'تأكيد كلمة المرور',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.createAccount': 'جارٍ إنشاء الحساب...',
    
    // Admin
    'admin.title': 'المسؤول',
    'admin.client': 'عميل',
    'admin.driver': 'سائق',
    'admin.allOrders': 'جميع الطلبات',
    'admin.manageUsers': 'إدارة المستخدمين',
    'admin.driverApprovals': 'موافقات السائقين',
    'admin.paymentManagement': 'إدارة المدفوعات',
    'admin.orderManagement': 'إدارة الطلبات',
    'admin.searchOrders': 'البحث بواسطة رقم الطلب أو العميل أو العنوان',
    'admin.search': 'بحث',
    'admin.allStatuses': 'جميع الحالات',
    'admin.refresh': 'تحديث',
    'admin.orderNumber': 'رقم الطلب',
    'admin.customer': 'العميل',
    'admin.status': 'الحالة',
    'admin.pickupAddress': 'عنوان الاستلام',
    'admin.deliveryAddress': 'عنوان التسليم',
    'admin.created': 'تاريخ الإنشاء',
    'admin.amount': 'المبلغ',
    'admin.actions': 'الإجراءات',
    'admin.details': 'التفاصيل',
    
    // Driver
    'driver.becomeDriver': 'هل تريد أن تصبح سائقاً؟',
    'driver.earnMoney': 'اكسب المال عن طريق توصيل الطرود',
    'driver.registration': 'تسجيل السائق',
    
    // Orders
    'orders.title': 'طلباتي',
    'orders.new': 'إنشاء طلب جديد',
    'orders.track': 'تتبع الطلب',
    'orders.details': 'تفاصيل الطلب',
    'orders.available': 'الطلبات المتاحة',
    'orders.current': 'الطلبات الحالية',
    'orders.history': 'سجل الطلبات',
    'orders.viewCurrentOrders': 'عرض الطلبات الحالية',
    'orders.haveActiveOrder': 'لديك طلب نشط',
    'orders.oneOrderAtTime': 'يمكنك قبول طلب واحد فقط في المرة الواحدة. يرجى إكمال أو إلغاء طلبك الحالي قبل قبول طلب جديد.',
    'orders.lookingToAccept': 'تبحث عن طلبات للقبول؟',
    'orders.pendingDescription': 'جميع الطلبات ذات حالة قيد الانتظار معروضة هنا. بمجرد قبول الطلب، سيظهر في الطلبات الحالية الخاصة بك.',
    'orders.loadingAvailable': 'جارٍ تحميل الطلبات المتاحة...',
    'orders.noAvailable': 'لا توجد طلبات متاحة',
    'orders.checkBackLater': 'لا توجد حاليًا طلبات متاحة للقبول. يرجى التحقق مرة أخرى لاحقًا.',
    'orders.orderNumber': 'الطلب رقم',
    'orders.acceptOrder': 'قبول الطلب',
    'orders.acceptingOrder': 'جارٍ القبول...',
    'orders.weightUnit': 'رطل',
    'orders.distanceUnit': 'ميل',
    'orders.distance': 'المسافة',
    'orders.timeUnit': 'دقيقة',
    'orders.estimatedTime': 'الوقت المقدر',
    'orders.fragileWarning': 'قابل للكسر - تعامل بحذر',
    
    // Payments
    'payment.confirmation': 'تأكيد الدفع',
    'payment.history': 'سجل المدفوعات',
    'payment.unconfirmedLimit': 'تم الوصول إلى حد المدفوعات غير المؤكدة',
    'payment.unconfirmedDescription': 'لديك حاليًا {0} مدفوعات غير مؤكدة. لا يمكنك قبول طلبات جديدة حتى تؤكد المدفوعات المعلقة.',
    'payment.viewPending': 'عرض المدفوعات المعلقة',
    
    // User
    'user.profile': 'الملف الشخصي',
    'user.notifications': 'الإشعارات',
    
    // Buttons
    'button.submit': 'إرسال',
    'button.cancel': 'إلغاء',
    'button.save': 'حفظ',
    'button.update': 'تحديث',
    'button.loading': 'جارٍ التحميل...',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.totalOrders': 'إجمالي الطلبات',
    'dashboard.activeOrders': 'الطلبات النشطة',
    'dashboard.completedOrders': 'الطلبات المكتملة',
    'dashboard.cancelledOrders': 'الطلبات الملغاة',
    'dashboard.pendingOrders': 'الطلبات المعلقة',
    'dashboard.recentOrders': 'الطلبات الأخيرة',
    'dashboard.noRecentOrders': 'لم يتم العثور على طلبات حديثة',
    'dashboard.trackingNumber': 'رقم التتبع',
    'dashboard.status': 'الحالة',
    'dashboard.createdAt': 'تاريخ الإنشاء',
    'dashboard.actions': 'الإجراءات',
    'dashboard.viewDetails': 'عرض التفاصيل',
    'dashboard.orderStatus.PENDING': 'قيد الانتظار',
    'dashboard.orderStatus.IN_TRANSIT': 'قيد النقل',
    'dashboard.orderStatus.DELIVERED': 'تم التوصيل',
    'dashboard.orderStatus.CANCELLED': 'ملغي',
    'dashboard.orderStatus.ACCEPTED': 'مقبول',
    'dashboard.orderStatus.PICKED_UP': 'تم الاستلام',
    
    // Profile
    'profile.editProfile': 'تعديل الملف الشخصي',
    'profile.saving': 'جارٍ الحفظ...',
    'profile.updateSuccess': 'تم تحديث الملف الشخصي بنجاح',
    
    // Order Form
    'orders.fillPickupFields': 'يرجى ملء جميع حقول عنوان الاستلام المطلوبة',
    'orders.fillDeliveryFields': 'يرجى ملء جميع حقول عنوان التسليم المطلوبة بما في ذلك رقم هاتف المستلم',
    'orders.invalidMobile': 'يرجى إدخال رقم هاتف صحيح للمستلم',
    'orders.fillPackageDetails': 'يرجى ملء وزن الطرد والسعر',
    'orders.invalidPrice': 'يرجى إدخال سعر صحيح أكبر من صفر',
    'orders.pickup': 'الاستلام',
    'orders.delivery': 'التوصيل',
    'orders.package': 'الطرد',
    'orders.location': 'الموقع',
    'orders.pickupAddress': 'عنوان الاستلام',
    'orders.deliveryAddress': 'عنوان التوصيل',
    'orders.street': 'الشارع',
    'orders.city': 'المدينة',
    'orders.state': 'المحافظة',
    'orders.recipientMobile': 'رقم هاتف المستلم',
    'orders.packageDetails': 'تفاصيل الطرد والسعر',
    'orders.weight': 'وزن الطرد (رطل)',
    'orders.dimensions': 'الأبعاد (طول×عرض×ارتفاع بالإنش)',
    'orders.description': 'وصف الطرد',
    'orders.fragile': 'هذا الطرد قابل للكسر',
    'orders.price': 'أدخل السعر',
    'orders.deliveryLocation': 'موقع التسليم',
    'orders.selectLocation': 'الرجاء تحديد موقع التسليم بالضبط على الخريطة',
    'orders.mapPlaceholder': 'سيتم عرض الخريطة هنا',
    'orders.mapIntegration': '(مطلوب تكامل مع خرائط جوجل أو خدمة مماثلة)',
    'orders.selectedLocation': 'الموقع المحدد',
    'orders.noLocationSelectedYet': 'لم يتم تحديد موقع بعد',
    'orders.useDeliveryAddress': 'استخدم عنوان التسليم',
    'orders.simulateMapSelection': 'محاكاة تحديد الخريطة',
    'orders.note': 'ملاحظة',
    'orders.realImplementation': 'في التطبيق الفعلي، سيتم استبدال هذا بخريطة تفاعلية حيث يمكن للمستخدمين تحديد موقع التسليم بدقة.',
    'orders.newOrderDescription': 'املأ النموذج لإنشاء طلب شحن جديد',
    'orders.creating': 'جارٍ إنشاء الطلب...',
    'orders.createOrder': 'إنشاء طلب',
    'button.back': 'رجوع',
    'button.next': 'التالي',
    
    // Pagination
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'pagination.noOrders': 'لم يتم العثور على طلبات مطابقة لمعاييرك',
    
    // Admin Dashboard
    'admin.dashboard': 'لوحة تحكم المسؤول',
    'admin.totalUsers': 'إجمالي المستخدمين',
    'admin.activeUsers': 'نشط',
    'admin.totalOrdersCount': 'إجمالي الطلبات',
    'admin.totalCompleted': 'مكتمل',
    'admin.totalRevenue': 'إجمالي الإيرادات',
    'admin.revenueGrowth': 'نمو',
    'admin.pendingDriversCount': 'السائقين المعلقين',
    'admin.awaitingApproval': 'في انتظار الموافقة',
    'admin.viewAllUsers': 'عرض جميع المستخدمين',
    'admin.viewAllOrders': 'عرض جميع الطلبات',
    'admin.revenueDetails': 'تفاصيل الإيرادات',
    'admin.viewPendingDrivers': 'عرض السائقين المعلقين',
    'admin.recentOrdersList': 'الطلبات الأخيرة',
    'admin.recentUsers': 'المستخدمين الأخيرين',
    'admin.noRecentOrders': 'لم يتم العثور على طلبات حديثة',
    'admin.noRecentUsers': 'لم يتم العثور على مستخدمين حديثين',
    'admin.orderNum': 'رقم الطلب',
    'admin.customerName': 'العميل',
    'admin.dateField': 'التاريخ',
    'admin.statusField': 'الحالة',
    'admin.amountField': 'المبلغ',
    'admin.nameField': 'الاسم',
    'admin.emailField': 'البريد الإلكتروني',
    'admin.roleField': 'الدور',
    'admin.joinedDate': 'تاريخ الانضمام',
    'admin.lastActive': 'آخر نشاط',
    'admin.viewAll': 'عرض الكل',
    'admin.never': 'أبدًا',
    
    // Logout
    'logout.confirmMessage': 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    
    // Common Loading and Error Messages
    'loading.message': 'جاري التحميل...',
    'error.failed': 'فشل تحميل البيانات. يرجى المحاولة مرة أخرى.',
    'error.auth': 'بيانات المستخدم غير مكتملة. يرجى تسجيل الدخول مرة أخرى.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>(defaultTranslations);
  
  // Initialize language from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('app_language');
      if (savedLanguage === 'ar' || savedLanguage === 'en') {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error reading language from localStorage:', error);
    }
  }, []);
  
  // Update HTML attributes and localStorage when language changes
  useEffect(() => {
    try {
      // Update localStorage
      localStorage.setItem('app_language', language);
      
      // Update HTML attributes
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      
      // Update body classes for font
      if (language === 'ar') {
        document.body.classList.add('font-tajawal');
      } else {
        document.body.classList.remove('font-tajawal');
      }
    } catch (error) {
      console.error('Error updating language attributes:', error);
    }
  }, [language]);
  
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };
  
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: changeLanguage, 
      t,
      translations
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 