import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      brand: 'Ember Sports',
      nav: {
        home: 'Home',
        booking: 'Book Court',
        myBookings: 'My Bookings',
        login: 'Login',
        logout: 'Logout'
      },
      hero: {
        title: 'Ember Sports Pickleball',
        subtitle: 'Professional pickleball court operations, providing you with a premium sports experience',
        cta: 'Book Now'
      },
      features: {
        courts: {
          title: 'Premium Courts',
          desc: '8 professional pickleball courts with professional lighting and facilities'
        },
        flexible: {
          title: 'Flexible Booking',
          desc: 'Book by the hour, check court availability anytime'
        },
        secure: {
          title: 'Secure Payment',
          desc: 'Online payment, court locked immediately after confirmation'
        }
      },
      pricing: {
        title: 'Court Pricing',
        subtitle: 'Transparent pricing, choose as needed',
        standard: 'Standard Court',
        vip: 'VIP Court',
        training: 'Training Court',
        perHour: '/hour'
      },
      booking: {
        title: 'Book Court',
        court: 'Court',
        available: 'Available',
        booked: 'Booked',
        confirm: 'Confirm Booking',
        total: 'Total',
        name: 'Your Name',
        phone: 'Phone Number',
        success: 'Booking confirmed!',
        error: 'Booking failed. Please try again.'
      },
      myBookings: {
        title: 'My Bookings',
        empty: 'No bookings yet',
        cancel: 'Cancel',
        cancelConfirm: 'Are you sure you want to cancel this booking?',
        status: {
          paid: 'Paid',
          pending: 'Pending',
          cancelled: 'Cancelled'
        }
      },
      login: {
        title: 'Welcome Back',
        subtitle: 'Login to manage your bookings',
        registerTitle: 'Create Account',
        registerSubtitle: 'Register to start booking courts',
        email: 'Email',
        password: 'Password',
        submit: 'Login',
        register: 'Register',
        noAccount: 'No account? Register now',
        hasAccount: 'Already have an account? Login',
        registerSuccess: 'Registration successful, please login'
      },
      common: {
        loading: 'Loading...'
      }
    }
  },
  zh: {
    translation: {
      brand: '合拍社',
      nav: {
        home: '首页',
        booking: '预订场地',
        myBookings: '我的预订',
        login: '登录',
        logout: '退出'
      },
      hero: {
        title: '合拍社匹克球',
        subtitle: '专业匹克球场馆运营，为您提供优质的运动体验',
        cta: '立即预订'
      },
      features: {
        courts: {
          title: '优质场地',
          desc: '8个专业匹克球场地，配备专业灯光和设施'
        },
        flexible: {
          title: '灵活预订',
          desc: '支持按小时预订，随时查看场地空闲情况'
        },
        secure: {
          title: '安全支付',
          desc: '在线支付，预订确认后立即锁定场地'
        }
      },
      pricing: {
        title: '场地价格',
        subtitle: '透明定价，按需选择',
        standard: '标准场地',
        vip: 'VIP场地',
        training: '训练场地',
        perHour: '/小时'
      },
      booking: {
        title: '场地预订',
        court: '场地',
        available: '空闲',
        booked: '已订',
        confirm: '确认预订',
        total: '总计',
        name: '您的姓名',
        phone: '联系电话',
        success: '预订成功！',
        error: '预订失败，请重试。'
      },
      myBookings: {
        title: '我的预订',
        empty: '暂无预订记录',
        cancel: '取消',
        cancelConfirm: '确定要取消此预订吗？',
        status: {
          paid: '已支付',
          pending: '待支付',
          cancelled: '已取消'
        }
      },
      login: {
        title: '欢迎回来',
        subtitle: '登录以管理您的预订',
        registerTitle: '创建账户',
        registerSubtitle: '注册以开始预订场地',
        email: '邮箱',
        password: '密码',
        submit: '登录',
        register: '注册',
        noAccount: '没有账户？立即注册',
        hasAccount: '已有账户？立即登录',
        registerSuccess: '注册成功，请登录'
      },
      common: {
        loading: '加载中...'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
