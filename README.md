# SSOPrivateEye

This repository contains the SSO-Private-Eye browser extension code that scans sites with SSO login options and displays the requested permissions. This work is part of our publication in the ***ACM Transactions on Privacy and Security (TOPS)*** journal. Please refer to the source code or the accompanying paper for details about the extension's design and implementation.

## :wrench: Getting started
- Download the code or clone this [repository](https://github.com/choruslab/2022-SSOPrivateEye.git)
- Open a window on a Chrome browser and navigate to the extensions page `chrome://extensions/`
- Enable developer mode
- For development purposes, you can load the extension by selecting `Load Unpacked` button
- Choose the root directory

## :zap: Using the extension
Once the extension is loaded, you can use the extension to view SSO permissions by:
1. Selecting the extension icon when you're on a website's login page with SSO options.
2. Selecting the `[SPEYE]view & opt-out login permissions...` button overlaid on IdP login prompts.


## :pencil2: Citation
If you use this work, please cite it as:
```
    @inproceedings{morkonda2025ssoprivateeye,
      title     = {"Sign in with ... Privacy": Timely Disclosure of Privacy Differences among Web SSO Login Options},
      author    = {Srivathsan G. Morkonda and Sonia Chiasson and Paul C. van Oorschot},
      booktitle = {ACM Transactions on Privacy & Security (TOPS)},
      year      = {2025},
      volume    = {},
      number    = {},
      doi       = {}
    }
```  
