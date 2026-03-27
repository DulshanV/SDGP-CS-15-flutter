import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Custom AppBar widget that includes the CeylonHS logo
class LogoAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showLogo;
  final VoidCallback? onLogoTap;
  final List<Widget>? actions;
  final double? elevation;

  const LogoAppBar({
    super.key,
    this.title,
    this.showLogo = true,
    this.onLogoTap,
    this.actions,
    this.elevation = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.primaryBlue,
      foregroundColor: Colors.white,
      elevation: elevation,
      title: showLogo
          ? Row(
              children: [
                GestureDetector(
                  onTap: onLogoTap,
                  child: Image.asset(
                    'assets/images/logo.png',
                    height: 40,
                    fit: BoxFit.contain,
                  ),
                ),
                if (title != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title!,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            )
          : Text(
              title ?? 'CeylonHS',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
      actions: actions,
      centerTitle: false,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(56);
}
