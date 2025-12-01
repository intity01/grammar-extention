# GitHub Pages Setup Instructions

## ✅ Code Successfully Pushed to GitHub!

Your code has been pushed to: https://github.com/intity01/grammar-extention

## 🌐 Enable GitHub Pages

Follow these steps to host your privacy policy on GitHub Pages:

### Step 1: Go to Repository Settings

1. Open your repository: https://github.com/intity01/grammar-extention
2. Click on **Settings** tab (top right)

### Step 2: Navigate to Pages Section

1. In the left sidebar, scroll down to **Pages** under "Code and automation"
2. Click on **Pages**

### Step 3: Configure GitHub Pages

1. Under **Source**, select **Deploy from a branch**
2. Under **Branch**:
   - Select **main** (or master)
   - Select **/docs** folder
   - Click **Save**

### Step 4: Wait for Deployment

1. GitHub will start building your site
2. Wait 1-2 minutes for deployment to complete
3. Refresh the page to see the deployment status

### Step 5: Verify Your Privacy Policy

Your privacy policy will be available at:

**Primary URL:** https://intity01.github.io/grammar-extention/

**Direct Privacy Policy:** https://intity01.github.io/grammar-extention/index.html

### Step 6: Test the URL

1. Click on the URL above (after deployment completes)
2. Verify the privacy policy displays correctly
3. Check that all sections are readable
4. Ensure styling looks good

## 📝 Update Store Listings

Once GitHub Pages is live, use this URL in your store submissions:

### Chrome Web Store
- **Privacy Policy URL:** `https://intity01.github.io/grammar-extention/`

### Microsoft Edge Add-ons
- **Privacy Policy URL:** `https://intity01.github.io/grammar-extention/`

## 🔧 Troubleshooting

### Pages Not Showing Up?

1. **Check deployment status:**
   - Go to repository → Actions tab
   - Look for "pages build and deployment" workflow
   - Ensure it completed successfully

2. **Verify settings:**
   - Settings → Pages
   - Ensure source is set to "main" branch and "/docs" folder
   - Click "Save" again if needed

3. **Wait longer:**
   - First deployment can take 5-10 minutes
   - Subsequent updates are faster (1-2 minutes)

### 404 Error?

1. Ensure files are in the `docs/` folder
2. Check that `index.html` exists in `docs/`
3. Verify branch is set to `main` (not `master`)
4. Try accessing with `/index.html` explicitly

### Styling Issues?

1. Check browser console for errors
2. Verify all CSS is inline in `index.html`
3. Clear browser cache and reload

## 📚 Available Pages

Once deployed, these pages will be available:

- **Privacy Policy (HTML):** https://intity01.github.io/grammar-extention/
- **Privacy Policy (Markdown):** https://intity01.github.io/grammar-extention/PRIVACY.html
- **README:** https://intity01.github.io/grammar-extention/README.html
- **Release Notes:** https://intity01.github.io/grammar-extention/RELEASE-NOTES.html

## 🎨 Customization

To customize the privacy policy page:

1. Edit `docs/index.html`
2. Commit and push changes:
   ```bash
   git add docs/index.html
   git commit -m "Update privacy policy"
   git push
   ```
3. Wait 1-2 minutes for GitHub Pages to rebuild

## ✅ Verification Checklist

- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled in Settings
- [ ] Source set to "main" branch, "/docs" folder
- [ ] Deployment completed successfully
- [ ] Privacy policy URL accessible
- [ ] Page displays correctly
- [ ] All sections readable
- [ ] Styling looks professional
- [ ] URL ready for store submission

## 🔗 Quick Links

- **Repository:** https://github.com/intity01/grammar-extention
- **Settings:** https://github.com/intity01/grammar-extention/settings
- **Pages Settings:** https://github.com/intity01/grammar-extention/settings/pages
- **Actions (Deployments):** https://github.com/intity01/grammar-extention/actions

## ⏭️ Next Steps

After GitHub Pages is live:

1. ✅ Copy the privacy policy URL
2. 📝 Proceed to Task 3: Write store listing content
3. 📦 Then Task 5: Package extension for distribution
4. 🚀 Finally: Submit to Chrome Web Store and Edge Add-ons

---

**Need Help?**
- Check GitHub Pages documentation: https://docs.github.com/en/pages
- Open an issue if you encounter problems
