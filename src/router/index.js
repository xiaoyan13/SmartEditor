import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from '../stores/userStore.js';
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashBoard from "../views/DashBoard.vue";
import EditView from "../views/EditView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: HomeView,
    },
    {
      path: "/login",
      component: LoginView,
    },
    {
      path: "/register",
      component: RegisterView,
    },
    {
      path: '/file_preview/:config_id/:file_name',
      name: 'file_preview',
      component: () => import('../components/FilePreview.vue')
    },
    {
      path: "/edit/:id",
      name: "edit",
      component: EditView,
      meta: { requiresAuth: true },
    },
    {
      path: "/dashboard",
      component: DashBoard,
      meta: { requiresAuth: true },
      children: [
        {
          path: "/",
          redirect: "/dashboard/DocumentPage",
        },
        {
          path: "DocumentPage",
          component: () => import("../components/DocumentPage.vue"),
        },
        {
          path: "ArticleGenerate",
          component: () => import('../components/ArticleGeneration.vue')
        },
        {
          path: "ArticleSetting",
          component: () => import("../components/ArticleSetting.vue"),
        },
        {
          path: "TemplateRepo",
          component: () => import("../components/TemplateRepo.vue"),
        },
        {
          path: "MyTemplate",
          component: () => import("../components/MyTemplate.vue"),
        },
        {
          path: "StarPage",
          component: () => import("../components/StarPage.vue"),
        },
        {
          path: "RecyclePage",
          component: () => import("../components/RecyclePage.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  //  如果用户登陆过
  if (userStore.isLoggedIn) {
    // 如果用户再次访问首页，直接跳转
    if (to.path === '/')
      next('/dashboard/DocumentPage');
    else
      next();
  }
  // 如果用户没有登陆过
  else {
    // 如果用户访问需要登陆的页面，跳转到登陆页面
    if (to.meta.requiresAuth)
      next('/login');
    else
      next();
  }
});

export default router;
